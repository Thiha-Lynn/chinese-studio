package live.ztvmm.chinese;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.core.app.ActivityScenario;
import androidx.test.platform.app.InstrumentationRegistry;
import android.content.pm.ActivityInfo;
import android.webkit.WebView;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class OfflineStudyTest {
    private String js(ActivityScenario<MainActivity> scenario, String script) throws Exception {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        scenario.onActivity(a -> a.getBridge().getWebView().evaluateJavascript(script, value -> { result.set(value); latch.countDown(); }));
        assertTrue("JavaScript callback timeout", latch.await(15, TimeUnit.SECONDS));
        return result.get();
    }
    private void waitFor(ActivityScenario<MainActivity> scenario, String predicate) throws Exception {
        for (int n = 0; n < 120; n++) { if ("true".equals(js(scenario, predicate))) return; Thread.sleep(500); }
        fail("Timed out: " + predicate + "; page: " + js(scenario, "document.body.innerText.slice(0,1200)"));
    }
    @Test public void bundledLessonsWorkOfflineAndPersist() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            waitFor(scenario, "document.querySelectorAll('.world-card').length === 10");
            assertEquals("true", js(scenario, "document.documentElement.scrollWidth <= innerWidth"));
            js(scenario, "window.__check='pending'; Promise.all([fetch('/course.json').then(r=>r.json()),fetch('/library/glyphs/我.json').then(r=>r.json()),fetch('/library/resources/Lesson%201.pdf').then(r=>r.arrayBuffer())]).then(([c,g,p])=>window.__check=(c.lessons.length===10 && c.vocab.length===249 && g.strokes.length>0 && p.byteLength>1000)?'ok':'bad').catch(e=>window.__check=String(e));");
            waitFor(scenario, "window.__check === 'ok'");
            js(scenario, "document.querySelectorAll('.world-card')[9].click()");
            waitFor(scenario, "document.body.innerText.includes('Flying to Thailand')");
            js(scenario, "Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Lesson notes').click()");
            waitFor(scenario, "document.querySelector('.slide-reader pre')?.textContent.includes('Lesson 10') === true");
            js(scenario, "history.pushState({},'', '/vocabulary'); dispatchEvent(new PopStateEvent('popstate'))");
            waitFor(scenario, "!!document.querySelector('button[aria-label^=\"Mark \"]')");
            js(scenario, "document.querySelector('button[aria-label^=\"Mark \"]').click()");
            waitFor(scenario, "Object.values(JSON.parse(localStorage.getItem('studio-device-progress')).known).includes(true)");
            scenario.onActivity(a -> a.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE));
            Thread.sleep(1500);
            assertEquals("true", js(scenario, "document.documentElement.scrollWidth <= innerWidth"));
        }
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            waitFor(scenario, "document.querySelectorAll('.world-card').length === 10");
            assertEquals("true", js(scenario, "Object.values(JSON.parse(localStorage.getItem('studio-device-progress')).known).includes(true)"));
        }
    }
}
