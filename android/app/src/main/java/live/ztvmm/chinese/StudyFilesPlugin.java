package live.ztvmm.chinese;

import android.content.Intent;
import android.net.Uri;
import android.speech.tts.TextToSpeech;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.Locale;

@CapacitorPlugin(name = "StudyFiles")
public class StudyFilesPlugin extends Plugin {
    private TextToSpeech tts;
    private boolean voiceReady;

    @Override public void load() {
        getActivity().runOnUiThread(() -> {
            tts = new TextToSpeech(getContext(), status -> {
                voiceReady = status == TextToSpeech.SUCCESS;
            });
        });
    }

    @PluginMethod public void speak(PluginCall call) {
        String text = call.getString("text", "");
        getActivity().runOnUiThread(() -> {
            if (!voiceReady || tts == null || text.length() > 4000) { call.reject("Voice unavailable"); return; }
            int language = tts.setLanguage(Locale.SIMPLIFIED_CHINESE);
            if (language < 0) { call.reject("Install a Mandarin voice"); return; }
            tts.setSpeechRate(0.78f);
            if (tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "study") == TextToSpeech.ERROR) call.reject("Speech unavailable");
            else call.resolve();
        });
    }

    @PluginMethod public void openResource(PluginCall call) {
        String path = call.getString("path", "");
        // This bridge exposes only bundled documents, never arbitrary device files.
        if (!path.startsWith("/library/") || path.contains("..") || path.contains("\\") || !path.matches(".*\\.(pdf|pptx|docx|png|webp)$")) {
            call.reject("Invalid course resource"); return;
        }
        try {
            File folder = new File(getContext().getCacheDir(), "course-files");
            if (!folder.exists() && !folder.mkdirs()) throw new java.io.IOException("Cannot create cache");
            File output = new File(folder, new File(path).getName());
            try (InputStream source = getContext().getAssets().open("public" + path); FileOutputStream dest = new FileOutputStream(output)) {
                byte[] buffer = new byte[65536];
                int count;
                while ((count = source.read(buffer)) != -1) dest.write(buffer, 0, count);
            }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", output);
            String mime = path.endsWith(".pdf") ? "application/pdf" : path.endsWith(".pptx") ? "application/vnd.openxmlformats-officedocument.presentationml.presentation" : path.endsWith(".docx") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : path.endsWith(".png") ? "image/png" : "image/webp";
            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType(mime);
            intent.putExtra(Intent.EXTRA_STREAM, uri);
            intent.setClipData(android.content.ClipData.newRawUri("Course resource", uri));
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().runOnUiThread(() -> {
                try { getActivity().startActivity(Intent.createChooser(intent, "Open or save course document")); call.resolve(); }
                catch (Exception e) { call.reject("No document viewer available"); }
            });
        } catch (Exception e) { call.reject("Could not read the course document"); }
    }

    @Override protected void handleOnDestroy() { if (tts != null) { tts.stop(); tts.shutdown(); } }
}
