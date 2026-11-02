package com.pureppt.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val WhitePure = Color(0xFFFFFFFF)
val SurfaceSoft = Color(0xFFF8FAFC)
val BorderSubtle = Color(0xFFE2E8F0)
val TextPrimary = Color(0xFF0F172A)
val TextSecondary = Color(0xFF475569)
val AccentSlate = Color(0xFF1E293B)
val AccentBlue = Color(0xFF2563EB)

private val LightColorScheme = lightColorScheme(
    primary = AccentSlate,
    onPrimary = WhitePure,
    primaryContainer = SurfaceSoft,
    onPrimaryContainer = TextPrimary,
    background = WhitePure,
    onBackground = TextPrimary,
    surface = WhitePure,
    onSurface = TextPrimary,
    surfaceVariant = SurfaceSoft,
    onSurfaceVariant = TextSecondary,
    outline = BorderSubtle
)

@Composable
fun PurePPTTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
