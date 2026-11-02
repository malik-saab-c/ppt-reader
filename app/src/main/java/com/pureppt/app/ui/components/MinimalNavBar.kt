package com.pureppt.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.Slideshow
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pureppt.app.ui.theme.BorderSubtle
import com.pureppt.app.ui.theme.TextPrimary
import com.pureppt.app.ui.theme.WhitePure

/**
 * Sleek Minimalist Navigation Menu in White Theme.
 */
@Composable
fun MinimalTopBar(
    title: String,
    currentSlide: Int,
    totalSlides: Int,
    onOpenFile: () -> Unit,
    onSaveToDownloads: () -> Unit,
    onAddNewSlide: () -> Unit
) {
    Surface(
        color = WhitePure,
        modifier = Modifier
            .fillMaxWidth()
            .border(width = 0.5.dp, color = BorderSubtle)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // App Branding & Title
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Slideshow,
                    contentDescription = "PurePPT",
                    tint = TextPrimary,
                    modifier = Modifier.size(22.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = "PurePPT",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = title.take(24),
                        fontSize = 11.sp,
                        color = Color(0xFF64748B)
                    )
                }
            }

            // Minimalist Action Icons
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                IconButton(onClick = onOpenFile) {
                    Icon(
                        imageVector = Icons.Default.FolderOpen,
                        contentDescription = "Open PPT/PPTX",
                        tint = TextPrimary,
                        modifier = Modifier.size(20.dp)
                    )
                }
                IconButton(onClick = onAddNewSlide) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Add Slide",
                        tint = TextPrimary,
                        modifier = Modifier.size(20.dp)
                    )
                }
                IconButton(onClick = onSaveToDownloads) {
                    Icon(
                        imageVector = Icons.Default.Download,
                        contentDescription = "Save to Downloads",
                        tint = TextPrimary,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun MinimalBottomBar(
    currentSlide: Int,
    totalSlides: Int,
    onPreviousSlide: () -> Unit,
    onNextSlide: () -> Unit,
    onEditSlide: () -> Unit
) {
    Surface(
        color = WhitePure,
        modifier = Modifier
            .fillMaxWidth()
            .border(width = 0.5.dp, color = BorderSubtle)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            IconButton(
                onClick = onPreviousSlide,
                enabled = currentSlide > 1
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Previous Slide",
                    tint = if (currentSlide > 1) TextPrimary else Color(0xFFCBD5E1)
                )
            }

            // Center slide counter pill
            Box(
                modifier = Modifier
                    .background(Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
                    .padding(horizontal = 14.dp, vertical = 6.dp)
                    .clickable { onEditSlide() },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "$currentSlide / $totalSlides",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
            }

            IconButton(
                onClick = onNextSlide,
                enabled = currentSlide < totalSlides
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = "Next Slide",
                    tint = if (currentSlide < totalSlides) TextPrimary else Color(0xFFCBD5E1)
                )
            }
        }
    }
}
