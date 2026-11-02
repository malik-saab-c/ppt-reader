import JSZip from 'jszip';
import { Presentation, Slide, SlideElement } from '../types/presentation';

/**
 * Real PPTX Parser and Generator using JSZip & OpenXML standards.
 * Reads actual .pptx files, extracting slide texts, shapes, images, and formatting.
 */

export async function parsePptxFile(file: File | Blob): Promise<Presentation> {
  const zip = await JSZip.loadAsync(file);
  const slides: Slide[] = [];

  // Find slide XML files (ppt/slides/slide1.xml, etc.)
  const slidePaths = Object.keys(zip.files).filter(path => 
    /^ppt\/slides\/slide\d+\.xml$/i.test(path)
  ).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });

  // Extract presentation dimensions if available in ppt/presentation.xml
  let width = 960;
  let height = 540;

  try {
    const presFile = zip.file('ppt/presentation.xml');
    if (presFile) {
      const presXml = await presFile.async('text');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(presXml, 'application/xml');
      const sldSz = xmlDoc.getElementsByTagName('p:sldSz')[0];
      if (sldSz) {
        const cx = parseInt(sldSz.getAttribute('cx') || '0', 10);
        const cy = parseInt(sldSz.getAttribute('cy') || '0', 10);
        if (cx > 0 && cy > 0) {
          // 1 pt = 12700 EMUs, standard coordinate scale
          const emuRatio = 960 / cx;
          width = 960;
          height = Math.round(cy * emuRatio);
        }
      }
    }
  } catch {
    // fallback to standard 16:9
    width = 960;
    height = 540;
  }

  const parser = new DOMParser();

  for (let i = 0; i < slidePaths.length; i++) {
    const slidePath = slidePaths[i];
    const slideXml = await zip.file(slidePath)!.async('text');
    const xmlDoc = parser.parseFromString(slideXml, 'application/xml');

    const elements: SlideElement[] = [];

    // Parse shapes and text frames
    const spElements = Array.from(xmlDoc.getElementsByTagName('p:sp'));
    for (const sp of spElements) {
      const txBody = sp.getElementsByTagName('p:txBody')[0];
      const xfrm = sp.getElementsByTagName('a:xfrm')[0];

      let x = 60;
      let y = 60 + elements.length * 70;
      let w = 840;
      let h = 80;

      if (xfrm) {
        const off = xfrm.getElementsByTagName('a:off')[0];
        const ext = xfrm.getElementsByTagName('a:ext')[0];
        if (off && ext) {
          const rawX = parseInt(off.getAttribute('x') || '0', 10);
          const rawY = parseInt(off.getAttribute('y') || '0', 10);
          const rawW = parseInt(ext.getAttribute('cx') || '0', 10);
          const rawH = parseInt(ext.getAttribute('cy') || '0', 10);

          // Convert EMUs to 960x540 viewport units (assume standard 12192000 EMU width for 16:9)
          const scaleFactor = 960 / 12192000;
          x = Math.max(20, Math.round(rawX * scaleFactor));
          y = Math.max(20, Math.round(rawY * scaleFactor));
          w = Math.max(100, Math.round(rawW * scaleFactor));
          h = Math.max(40, Math.round(rawH * scaleFactor));
        }
      }

      if (txBody) {
        const pTags = Array.from(txBody.getElementsByTagName('a:p'));
        const textParts: string[] = [];
        let fontSize = 24;
        let isBold = false;
        let isItalic = false;
        let textColor = '#0F172A';

        for (const p of pTags) {
          const rTags = Array.from(p.getElementsByTagName('a:r'));
          for (const r of rTags) {
            const t = r.getElementsByTagName('a:t')[0]?.textContent || '';
            textParts.push(t);

            const rPr = r.getElementsByTagName('a:rPr')[0];
            if (rPr) {
              const sz = parseInt(rPr.getAttribute('sz') || '0', 10);
              if (sz > 0) fontSize = Math.round(sz / 100);
              if (rPr.getAttribute('b') === '1') isBold = true;
              if (rPr.getAttribute('i') === '1') isItalic = true;

              const srgbClr = rPr.getElementsByTagName('a:srgbClr')[0];
              if (srgbClr) {
                const val = srgbClr.getAttribute('val');
                if (val) textColor = `#${val}`;
              }
            }
          }
        }

        const fullText = textParts.join('').trim();
        if (fullText) {
          elements.push({
            id: `el_${i}_${elements.length}`,
            type: 'text',
            x,
            y,
            width: w,
            height: h,
            zIndex: elements.length,
            text: fullText,
            fontSize: Math.min(Math.max(fontSize, 14), 48),
            fontWeight: isBold ? 'bold' : 'normal',
            fontStyle: isItalic ? 'italic' : 'normal',
            color: textColor,
            textAlign: 'left'
          });
        }
      }
    }

    // Parse pictures (p:pic)
    const picElements = Array.from(xmlDoc.getElementsByTagName('p:pic'));
    // Read relationships for this slide to find media target
    const relsPath = slidePath.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
    const relsFile = zip.file(relsPath);
    const relsMap: Record<string, string> = {};

    if (relsFile) {
      const relsXml = await relsFile.async('text');
      const relsDoc = parser.parseFromString(relsXml, 'application/xml');
      const relNodes = Array.from(relsDoc.getElementsByTagName('Relationship'));
      for (const rel of relNodes) {
        const id = rel.getAttribute('Id');
        const target = rel.getAttribute('Target');
        if (id && target) {
          // target is e.g. "../media/image1.png"
          const cleanTarget = target.replace(/^\.\.\//, 'ppt/');
          relsMap[id] = cleanTarget;
        }
      }
    }

    for (const pic of picElements) {
      const blip = pic.getElementsByTagName('a:blip')[0];
      const embedId = blip?.getAttribute('r:embed');
      const xfrm = pic.getElementsByTagName('a:xfrm')[0];

      let imgX = 80;
      let imgY = 120;
      let imgW = 400;
      let imgH = 260;

      if (xfrm) {
        const off = xfrm.getElementsByTagName('a:off')[0];
        const ext = xfrm.getElementsByTagName('a:ext')[0];
        if (off && ext) {
          const rawX = parseInt(off.getAttribute('x') || '0', 10);
          const rawY = parseInt(off.getAttribute('y') || '0', 10);
          const rawW = parseInt(ext.getAttribute('cx') || '0', 10);
          const rawH = parseInt(ext.getAttribute('cy') || '0', 10);
          const scaleFactor = 960 / 12192000;
          imgX = Math.round(rawX * scaleFactor);
          imgY = Math.round(rawY * scaleFactor);
          imgW = Math.round(rawW * scaleFactor);
          imgH = Math.round(rawH * scaleFactor);
        }
      }

      if (embedId && relsMap[embedId]) {
        const mediaFile = zip.file(relsMap[embedId]);
        if (mediaFile) {
          const imgBlob = await mediaFile.async('blob');
          const dataUrl = URL.createObjectURL(imgBlob);
          elements.push({
            id: `pic_${i}_${elements.length}`,
            type: 'image',
            x: imgX,
            y: imgY,
            width: imgW,
            height: imgH,
            zIndex: elements.length,
            src: dataUrl
          });
        }
      }
    }

    // If slide had no elements, supply clean default elements
    if (elements.length === 0) {
      elements.push({
        id: `el_blank_${i}`,
        type: 'text',
        x: 80,
        y: 180,
        width: 800,
        height: 80,
        zIndex: 1,
        text: `Slide ${i + 1}`,
        fontSize: 36,
        fontWeight: 'bold',
        color: '#0F172A',
        textAlign: 'center'
      });
    }

    slides.push({
      id: `slide_${i + 1}`,
      slideNumber: i + 1,
      background: { type: 'solid', color: '#FFFFFF' },
      elements
    });
  }

  // Fallback if no slides found
  if (slides.length === 0) {
    slides.push(createDefaultTemplateSlide(1));
  }

  const fileName = (file as File).name || 'Presentation';
  const cleanTitle = fileName.replace(/\.pptx?$/i, '');

  return {
    id: `pres_${Date.now()}`,
    title: cleanTitle,
    createdDate: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    width,
    height,
    aspectRatio: '16:9',
    slides
  };
}

/**
 * Generates an ECMA-376 OpenXML PPTX file from our Presentation model.
 */
export async function exportToPptxBlob(presentation: Presentation): Promise<Blob> {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  let contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
`;

  presentation.slides.forEach((_, idx) => {
    contentTypesXml += `  <Override PartName="/ppt/slides/slide${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>\n`;
  });
  contentTypesXml += `</Types>`;
  zip.file('[Content_Types].xml', contentTypesXml);

  // 2. _rels/.rels
  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`;
  zip.file('_rels/.rels', rootRelsXml);

  // 3. ppt/presentation.xml
  let presXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst/>
  <p:sldIdLst>
`;

  presentation.slides.forEach((_, idx) => {
    presXml += `    <p:sldId id="${256 + idx}" r:id="rId${idx + 1}"/>\n`;
  });

  presXml += `  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
</p:presentation>`;
  zip.file('ppt/presentation.xml', presXml);

  // 4. ppt/_rels/presentation.xml.rels
  let presRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
`;
  presentation.slides.forEach((_, idx) => {
    presRelsXml += `  <Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${idx + 1}.xml"/>\n`;
  });
  presRelsXml += `</Relationships>`;
  zip.file('ppt/_rels/presentation.xml.rels', presRelsXml);

  // 5. Slides
  const scale = 12192000 / 960; // EMU conversion

  presentation.slides.forEach((slide, idx) => {
    let slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
`;

    slide.elements.forEach((el, elIdx) => {
      const emuX = Math.round(el.x * scale);
      const emuY = Math.round(el.y * scale);
      const emuW = Math.round(el.width * scale);
      const emuH = Math.round(el.height * scale);
      const colorHex = (el.color || '#0F172A').replace('#', '');
      const fontSizeHundreds = Math.round((el.fontSize || 20) * 100);

      slideXml += `      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="${elIdx + 2}" name="Shape ${elIdx + 1}"/>
          <p:cNvSpPr txBox="1"/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="${emuX}" y="${emuY}"/>
            <a:ext cx="${emuW}" cy="${emuH}"/>
          </a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:noFill/>
        </p:spPr>
        <p:txBody>
          <a:bodyPr wrap="square" rtlCol="0"/>
          <a:lstStyle/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="${fontSizeHundreds}" b="${el.fontWeight === 'bold' ? '1' : '0'}" i="${el.fontStyle === 'italic' ? '1' : '0'}">
                <a:solidFill><a:srgbClr val="${colorHex}"/></a:solidFill>
              </a:rPr>
              <a:t>${escapeXml(el.text || '')}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
`;
    });

    slideXml += `    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;

    zip.file(`ppt/slides/slide${idx + 1}.xml`, slideXml);
  });

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function createDefaultTemplateSlide(num: number): Slide {
  return {
    id: `slide_${num}_${Date.now()}`,
    slideNumber: num,
    background: { type: 'solid', color: '#FFFFFF' },
    elements: [
      {
        id: `el_title_${num}`,
        type: 'text',
        x: 80,
        y: 110,
        width: 800,
        height: 70,
        zIndex: 1,
        text: 'PurePPT: Presentation Ready',
        fontSize: 38,
        fontWeight: 'bold',
        color: '#0F172A',
        textAlign: 'left'
      },
      {
        id: `el_desc_${num}`,
        type: 'text',
        x: 80,
        y: 200,
        width: 800,
        height: 120,
        zIndex: 2,
        text: 'Accurate PPT & PPTX Reader and Editor\nWhite Theme • Zero Glitch Mobile Display • Direct Download',
        fontSize: 20,
        color: '#475569',
        textAlign: 'left'
      }
    ]
  };
}

export function createSamplePresentation(): Presentation {
  return {
    id: 'sample_deck',
    title: 'Executive Overview',
    createdDate: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    width: 960,
    height: 540,
    aspectRatio: '16:9',
    slides: [
      {
        id: 's1',
        slideNumber: 1,
        background: { type: 'solid', color: '#FFFFFF' },
        elements: [
          {
            id: 's1_e0',
            type: 'shape',
            shapeType: 'rounded-rect',
            x: 80,
            y: 80,
            width: 140,
            height: 32,
            zIndex: 0,
            fillColor: '#F1F5F9',
            strokeColor: '#E2E8F0',
            strokeWidth: 1
          },
          {
            id: 's1_e1',
            type: 'text',
            x: 95,
            y: 86,
            width: 120,
            height: 24,
            zIndex: 1,
            text: 'PUREPPT 2026',
            fontSize: 12,
            fontWeight: 'bold',
            color: '#2563EB',
            textAlign: 'left'
          },
          {
            id: 's1_e2',
            type: 'text',
            x: 80,
            y: 130,
            width: 800,
            height: 80,
            zIndex: 2,
            text: 'Accurate Presentation Architecture',
            fontSize: 42,
            fontWeight: 'bold',
            color: '#0F172A',
            textAlign: 'left'
          },
          {
            id: 's1_e3',
            type: 'text',
            x: 80,
            y: 230,
            width: 780,
            height: 100,
            zIndex: 3,
            text: 'Flawless mobile presentation rendering with zero text clipping, clean white design language, and native Android Download folder integration.',
            fontSize: 20,
            color: '#475569',
            textAlign: 'left'
          }
        ]
      },
      {
        id: 's2',
        slideNumber: 2,
        background: { type: 'solid', color: '#FFFFFF' },
        elements: [
          {
            id: 's2_e1',
            type: 'text',
            x: 80,
            y: 70,
            width: 800,
            height: 50,
            zIndex: 1,
            text: 'Key Performance Pillars',
            fontSize: 32,
            fontWeight: 'bold',
            color: '#0F172A',
            textAlign: 'left'
          },
          {
            id: 's2_card1',
            type: 'shape',
            shapeType: 'rounded-rect',
            x: 80,
            y: 150,
            width: 250,
            height: 260,
            zIndex: 2,
            fillColor: '#FAFAFA',
            strokeColor: '#E2E8F0',
            strokeWidth: 1
          },
          {
            id: 's2_card1_t1',
            type: 'text',
            x: 100,
            y: 180,
            width: 210,
            height: 30,
            zIndex: 3,
            text: '01. Zero Glitch',
            fontSize: 18,
            fontWeight: 'bold',
            color: '#0F172A'
          },
          {
            id: 's2_card1_t2',
            type: 'text',
            x: 100,
            y: 220,
            width: 210,
            height: 160,
            zIndex: 4,
            text: 'Proportional viewport scaling ensures every shape, font, and picture fits mobile screens without cutting off words.',
            fontSize: 14,
            color: '#64748B'
          },
          {
            id: 's2_card2',
            type: 'shape',
            shapeType: 'rounded-rect',
            x: 355,
            y: 150,
            width: 250,
            height: 260,
            zIndex: 2,
            fillColor: '#FAFAFA',
            strokeColor: '#E2E8F0',
            strokeWidth: 1
          },
          {
            id: 's2_card2_t1',
            type: 'text',
            x: 375,
            y: 180,
            width: 210,
            height: 30,
            zIndex: 3,
            text: '02. White Theme',
            fontSize: 18,
            fontWeight: 'bold',
            color: '#0F172A'
          },
          {
            id: 's2_card2_t2',
            type: 'text',
            x: 375,
            y: 220,
            width: 210,
            height: 160,
            zIndex: 4,
            text: 'Distraction-free pure white interface with sleek minimalist navigation, fine borders, and high-readability typography.',
            fontSize: 14,
            color: '#64748B'
          },
          {
            id: 's2_card3',
            type: 'shape',
            shapeType: 'rounded-rect',
            x: 630,
            y: 150,
            width: 250,
            height: 260,
            zIndex: 2,
            fillColor: '#FAFAFA',
            strokeColor: '#E2E8F0',
            strokeWidth: 1
          },
          {
            id: 's2_card3_t1',
            type: 'text',
            x: 650,
            y: 180,
            width: 210,
            height: 30,
            zIndex: 3,
            text: '03. Direct Storage',
            fontSize: 18,
            fontWeight: 'bold',
            color: '#0F172A'
          },
          {
            id: 's2_card3_t2',
            type: 'text',
            x: 650,
            y: 220,
            width: 210,
            height: 160,
            zIndex: 4,
            text: 'Direct save to device Download folder with proper Android storage permissions and standard OpenXML format.',
            fontSize: 14,
            color: '#64748B'
          }
        ]
      }
    ]
  };
}
