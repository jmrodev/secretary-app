plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.secretaryapp"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.secretaryapp"
        minSdk = 26
        targetSdk = 34
        versionCode = 23
        versionName = "1.9.3.1"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            isShrinkResources = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
        debug {
            isMinifyEnabled = false
            isShrinkResources = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    applicationVariants.all {
        outputs.all {
            val output = this as com.android.build.gradle.internal.api.BaseVariantOutputImpl
            output.outputFileName = "secretary-app-v${defaultConfig.versionName}.apk"
        }
    }

    // Auto-copy APK content
    tasks.register<Copy>("copyApkToServer") {
        description = "Copies the generated APK to the server uploads directory"
        val apkName = "secretary-app-v${defaultConfig.versionName}.apk"
        
        from(layout.buildDirectory.dir("outputs/apk/debug").get().file(apkName))
        into("/home/cima/Documentos/secretary-app/server/uploads/")
        rename { "secretary-app.apk" }
    }

    afterEvaluate {
        tasks.named("assembleDebug") {
            finalizedBy("copyApkToServer")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    
    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0") // Useful for debug
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    
    // WorkManager for robust background tasks
    implementation("androidx.work:work-runtime-ktx:2.9.0")

    // QR Scanning
    implementation("com.journeyapps:zxing-android-embedded:4.3.0")
    implementation("com.google.zxing:core:3.4.1")
}
