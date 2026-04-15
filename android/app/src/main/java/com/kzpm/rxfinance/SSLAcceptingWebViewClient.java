package com.kzpm.rxfinance;

import android.annotation.SuppressLint;
import android.net.http.SslError;
import android.webkit.SslErrorHandler;
import android.webkit.WebView;

import com.getcapacitor.BridgeWebViewClient;
import com.getcapacitor.Bridge;

public class SSLAcceptingWebViewClient extends BridgeWebViewClient {

    public SSLAcceptingWebViewClient(Bridge bridge) {
        super(bridge);
    }

    @SuppressLint("WebViewClientOnReceivedSslError")
    @Override
    public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
        // Игнорируем все SSL-ошибки (для локального сервера с самоподписанным сертификатом)
        handler.proceed();
    }
}
