package com.example.crypto;

import java.security.MessageDigest;
import java.security.KeyPairGenerator;
import javax.crypto.Cipher;
import javax.net.ssl.SSLContext;

public class CryptoHandler {
    public static void processData() throws Exception {
        // Weak MD5
        MessageDigest md = MessageDigest.getInstance("MD5");
        
        // Weak DES Cipher
        Cipher cipher = Cipher.getInstance("DES");

        // Weak RSA KeyGenerator
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(1024);

        // Weak SSL / TLS
        SSLContext sslContext = SSLContext.getInstance("TLSv1");
    }
}
