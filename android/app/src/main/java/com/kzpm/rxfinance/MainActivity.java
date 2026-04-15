package com.kzpm.rxfinance;

import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();

        // Получаем WebView и устанавливаем кастомный WebViewClient
        try {
            Bridge bridge = getBridge();
            if (bridge != null) {
                WebView webView = bridge.getWebView();
                if (webView != null) {
                    webView.setWebViewClient(new SSLAcceptingWebViewClient(bridge));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
