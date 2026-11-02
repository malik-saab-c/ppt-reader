package com.pureppt.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.pureppt.app.data.PptEngine
import com.pureppt.app.data.PresentationDoc
import com.pureppt.app.data.SlideDoc
import com.pureppt.app.data.SlideElementDoc
import com.pureppt.app.data.StorageManager
import com.pureppt.app.ui.components.MinimalBottomBar
import com.pureppt.app.ui.components.MinimalTopBar
import com.pureppt.app.ui.components.SlideRenderer
import com.pureppt.app.ui.theme.PurePPTTheme
import com.pureppt.app.ui.theme.WhitePure
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            PurePPTTheme {
                var presentation by remember {
                    mutableStateOf(
                        PresentationDoc(
                            title = "My Presentation",
                            slides = mutableListOf(PptEngine.createDefaultSlide(1))
                        )
                    )
                }

                var currentSlideIndex by remember { mutableIntStateOf(0) }
                var isEditingText by remember { mutableStateOf(false) }
                var textToEdit by remember { mutableStateOf("") }
                var activeElementToEdit by remember { mutableStateOf<SlideElementDoc.TextElement?>(null) }
                val coroutineScope = rememberCoroutineScope()

                // File Open Launcher
                val openDocLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.OpenDocument()
                ) { uri: Uri? ->
                    uri?.let { fileUri ->
                        coroutineScope.launch(Dispatchers.IO) {
                            try {
                                contentResolver.openInputStream(fileUri)?.use { stream ->
                                    val fileName = fileUri.lastPathSegment ?: "ImportedPresentation"
                                    val parsedDoc = PptEngine.parsePptx(stream, fileName)
                                    withContext(Dispatchers.Main) {
                                        presentation = parsedDoc
                                        currentSlideIndex = 0
                                        Toast.makeText(this@MainActivity, "Opened: ${parsedDoc.title}", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            } catch (e: Exception) {
                                e.printStackTrace()
                                withContext(Dispatchers.Main) {
                                    Toast.makeText(this@MainActivity, "Error reading file: ${e.message}", Toast.LENGTH_LONG).show()
                                }
                            }
                        }
                    }
                }

                // Check intent if app was opened via file manager
                LaunchedEffect(intent) {
                    if (intent?.action == Intent.ACTION_VIEW && intent.data != null) {
                        intent.data?.let { uri ->
                            coroutineScope.launch(Dispatchers.IO) {
                                try {
                                    contentResolver.openInputStream(uri)?.use { stream ->
                                        val parsedDoc = PptEngine.parsePptx(stream, "Viewed Presentation")
                                        withContext(Dispatchers.Main) {
                                            presentation = parsedDoc
                                            currentSlideIndex = 0
                                        }
                                    }
                                } catch (e: Exception) {
                                    e.printStackTrace()
                                }
                            }
                        }
                    }
                }

                val currentSlide = presentation.slides.getOrNull(currentSlideIndex)
                    ?: presentation.slides.firstOrNull()
                    ?: PptEngine.createDefaultSlide(1)

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    containerColor = WhitePure,
                    topBar = {
                        MinimalTopBar(
                            title = presentation.title,
                            currentSlide = currentSlideIndex + 1,
                            totalSlides = presentation.slides.size,
                            onOpenFile = {
                                openDocLauncher.launch(
                                    arrayOf(
                                        "application/vnd.ms-powerpoint",
                                        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                                        "application/octet-stream"
                                    )
                                )
                            },
                            onSaveToDownloads = {
                                coroutineScope.launch(Dispatchers.IO) {
                                    val bytes = PptEngine.exportToPptxBytes(presentation)
                                    withContext(Dispatchers.Main) {
                                        StorageManager.saveToDownloadFolder(
                                            context = this@MainActivity,
                                            fileName = presentation.title,
                                            fileBytes = bytes
                                        )
                                    }
                                }
                            },
                            onAddNewSlide = {
                                val newIndex = presentation.slides.size + 1
                                val newSlide = PptEngine.createDefaultSlide(newIndex)
                                val updatedSlides = presentation.slides.toMutableList()
                                updatedSlides.add(newSlide)
                                presentation = presentation.copy(slides = updatedSlides)
                                currentSlideIndex = updatedSlides.size - 1
                                Toast.makeText(this, "Added Slide $newIndex", Toast.LENGTH_SHORT).show()
                            }
                        )
                    },
                    bottomBar = {
                        MinimalBottomBar(
                            currentSlide = currentSlideIndex + 1,
                            totalSlides = presentation.slides.size,
                            onPreviousSlide = {
                                if (currentSlideIndex > 0) currentSlideIndex--
                            },
                            onNextSlide = {
                                if (currentSlideIndex < presentation.slides.size - 1) currentSlideIndex++
                            },
                            onEditSlide = {
                                // Find primary text element to edit
                                val firstText = currentSlide.elements.filterIsInstance<SlideElementDoc.TextElement>().firstOrNull()
                                if (firstText != null) {
                                    activeElementToEdit = firstText
                                    textToEdit = firstText.text
                                    isEditingText = true
                                }
                            }
                        )
                    }
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                            .background(Color(0xFFFAFAFA))
                    ) {
                        SlideRenderer(
                            slide = currentSlide,
                            canvasWidth = presentation.width,
                            canvasHeight = presentation.height,
                            modifier = Modifier.fillMaxSize()
                        )

                        // Quick Text Edit Dialog
                        if (isEditingText && activeElementToEdit != null) {
                            AlertDialog(
                                onDismissRequest = { isEditingText = false },
                                title = { Text("Edit Slide Text", color = Color(0xFF0F172A)) },
                                text = {
                                    OutlinedTextField(
                                        value = textToEdit,
                                        onValueChange = { textToEdit = it },
                                        label = { Text("Text Content") },
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                },
                                confirmButton = {
                                    TextButton(
                                        onClick = {
                                            activeElementToEdit?.text = textToEdit
                                            isEditingText = false
                                        }
                                    ) {
                                        Text("Save", color = Color(0xFF2563EB))
                                    }
                                },
                                dismissButton = {
                                    TextButton(onClick = { isEditingText = false }) {
                                        Text("Cancel")
                                    }
                                },
                                containerColor = WhitePure
                            )
                        }
                    }
                }
            }
        }
    }
}
