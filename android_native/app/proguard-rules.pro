# Preservation of generic signatures and annotations
-keepattributes Signature, InnerClasses, EnclosingMethod
-keepattributes RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations
-keepattributes RuntimeInvisibleAnnotations, RuntimeInvisibleParameterAnnotations

# App specific: Keep all models and API interfaces completely
-keep class com.secretaryapp.model.** { *; }
-keep class com.secretaryapp.api.** { *; }

# Retrofit 2.x
-keep class retrofit2.** { *; }
-dontwarn retrofit2.**
-keepclasseswithmembers interface * {
    @retrofit2.http.* <methods>;
}

# OkHttp 3.x
-keep class okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**

# GSON
-keep class com.google.gson.** { *; }
-keep class com.google.gson.reflect.TypeToken
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.TypeAdapter

# Keep field names for GSON
-keepclassmembers class ** {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Coroutines - keep the classes that handle results
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**
