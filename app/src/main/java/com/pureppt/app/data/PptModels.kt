package com.pureppt.app.data

import android.graphics.Bitmap

/**
 * Universal Presentation Data Models for accurate PPT/PPTX reading, editing, and rendering.
 */

data class PresentationDoc(
    val title: String,
    val width: Float = 960f,  // Standard 16:9 widescreen coordinate space
    val height: Float = 540f,
    val slides: MutableList<SlideDoc> = mutableListOf()
)

data class SlideDoc(
    val id: String,
    val slideNumber: Int,
    val backgroundColor: Long = 0xFFFFFFFF,
    val elements: MutableList<SlideElementDoc> = mutableListOf()
)

sealed class SlideElementDoc {
    abstract val id: String
    abstract var x: Float
    abstract var y: Float
    abstract var width: Float
    abstract var height: Float
    abstract var zIndex: Int

    data class TextElement(
        override val id: String,
        override var x: Float,
        override var y: Float,
        override var width: Float,
        override var height: Float,
        override var zIndex: Int = 1,
        var text: String,
        var fontSize: Float = 24f,
        var textColor: Long = 0xFF0F172A,
        var isBold: Boolean = false,
        var isItalic: Boolean = false,
        var alignment: TextAlignment = TextAlignment.LEFT
    ) : SlideElementDoc()

    data class ImageElement(
        override val id: String,
        override var x: Float,
        override var y: Float,
        override var width: Float,
        override var height: Float,
        override var zIndex: Int = 2,
        var bitmap: Bitmap? = null,
        var imageUri: String? = null
    ) : SlideElementDoc()

    data class ShapeElement(
        override val id: String,
        override var x: Float,
        override var y: Float,
        override var width: Float,
        override var height: Float,
        override var zIndex: Int = 0,
        var shapeType: String = "RECTANGLE",
        var fillColor: Long = 0xFFF1F5F9,
        var strokeColor: Long = 0xFFCBD5E1,
        var strokeWidth: Float = 1.5f
    ) : SlideElementDoc()
}

enum class TextAlignment {
    LEFT, CENTER, RIGHT, JUSTIFY
}
