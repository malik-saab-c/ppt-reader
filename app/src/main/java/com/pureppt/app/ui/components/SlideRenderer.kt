package com.pureppt.app.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.rememberTransformableState
import androidx.compose.foundation.gestures.transformable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pureppt.app.data.SlideDoc
import com.pureppt.app.data.SlideElementDoc
import com.pureppt.app.data.TextAlignment
import kotlin.math.min

/**
 * High-accuracy Slide Renderer.
 * Scales slide proportionally to eliminate any mobile layout glitch, text cut, or image bleed.
 */
@Composable
fun SlideRenderer(
    slide: SlideDoc,
    canvasWidth: Float = 960f,
    canvasHeight: Float = 540f,
    isInteractiveZoom: Boolean = true,
    selectedElementId: String? = null,
    onSelectElement: ((SlideElementDoc) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var scale by remember { mutableFloatStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }

    val transformState = rememberTransformableState { zoomChange, panChange, _ ->
        if (isInteractiveZoom) {
            scale = (scale * zoomChange).coerceIn(1f, 4f)
            if (scale > 1f) {
                offset += panChange
            } else {
                offset = Offset.Zero
            }
        }
    }

    BoxWithConstraints(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
            .transformable(state = transformState),
        contentAlignment = Alignment.Center
    ) {
        val containerWidth = maxWidth.value
        val containerHeight = maxHeight.value

        // Proportional scale factor ensuring 100% visible slide without any cutoff
        val baseScale = min(containerWidth / canvasWidth, containerHeight / canvasHeight) * 0.94f
        val renderedWidth = canvasWidth * baseScale
        val renderedHeight = canvasHeight * baseScale

        Box(
            modifier = Modifier
                .graphicsLayer {
                    scaleX = scale
                    scaleY = scale
                    translationX = offset.x
                    translationY = offset.y
                }
                .width(renderedWidth.dp)
                .height(renderedHeight.dp)
                .shadow(elevation = 6.dp, shape = RoundedCornerShape(4.dp))
                .clip(RoundedCornerShape(4.dp))
                .background(Color(slide.backgroundColor))
                .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(4.dp))
        ) {
            // Render each element placed at exact relative coordinates
            for (element in slide.elements.sortedBy { it.zIndex }) {
                val elementScale = baseScale
                val elX = (element.x * elementScale).dp
                val elY = (element.y * elementScale).dp
                val elW = (element.width * elementScale).dp
                val elH = (element.height * elementScale).dp

                Box(
                    modifier = Modifier
                        .offset(x = elX, y = elY)
                        .width(elW)
                        .height(elH)
                ) {
                    when (element) {
                        is SlideElementDoc.TextElement -> {
                            val align = when (element.alignment) {
                                TextAlignment.LEFT -> TextAlign.Left
                                TextAlignment.CENTER -> TextAlign.Center
                                TextAlignment.RIGHT -> TextAlign.Right
                                TextAlignment.JUSTIFY -> TextAlign.Justify
                            }
                            Text(
                                text = element.text,
                                fontSize = (element.fontSize * baseScale * 0.9f).sp,
                                fontWeight = if (element.isBold) FontWeight.Bold else FontWeight.Normal,
                                fontStyle = if (element.isItalic) FontStyle.Italic else FontStyle.Normal,
                                color = Color(element.textColor),
                                textAlign = align,
                                fontFamily = FontFamily.Default,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                        is SlideElementDoc.ImageElement -> {
                            element.bitmap?.let { bmp ->
                                Image(
                                    bitmap = bmp.asImageBitmap(),
                                    contentDescription = "Slide Image",
                                    contentScale = ContentScale.Fit,
                                    modifier = Modifier.fillMaxSize()
                                )
                            }
                        }
                        is SlideElementDoc.ShapeElement -> {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(Color(element.fillColor), RoundedCornerShape(2.dp))
                                    .border(1.dp, Color(element.strokeColor), RoundedCornerShape(2.dp))
                            )
                        }
                    }
                }
            }
        }
    }
}
