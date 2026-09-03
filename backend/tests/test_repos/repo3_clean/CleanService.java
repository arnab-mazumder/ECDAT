package com.example.clean;

import java.security.MessageDigest;
import java.security.KeyPairGenerator;
import javax.crypto.Cipher;

public class CleanService {
    public static void safeCrypto() throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(4096);
    }
}
