export const mockScan = {
  id: "scan-001",

  repository: {
    name: "banking-system",
    source: "banking-system.zip",
    filesScanned: 12438,
    languages: ["Python", "Java"],
    duration: 48,
  },

  summary: {
    overallRisk: 78,
    riskLevel: "High",

    totalFindings: 47,

    severity: {
      critical: 8,
      high: 14,
      medium: 17,
      low: 8,
    },
  },

  findings: [
    {
      id: "finding-001",

      algorithm: "RSA-1024",
      artifactType: "Source Code",

      file: "src/auth/token_signer.py",
      line: 42,
      language: "Python",

      riskScore: 94,
      severity: "Critical",

      keySize: "1024-bit",

      riskReasoning: {
        dataLifetime: 10,
        migrationTime: 2,
        quantumHorizon: 10,
        formula: "X + Y > Z",
      },

      recommendation: {
        algorithm: "ML-KEM-768",
        standard: "NIST FIPS 203",
        rationale:
          "Migrate to a quantum-resistant key establishment mechanism.",
      },

      code: {
        vulnerable: "key = RSA.generate(1024)",
        suggested: "key = ml_kem_generate_keypair()",
      },

      status: "Open",
    },

    {
      id: "finding-002",

      algorithm: "DES",
      artifactType: "Source Code",

      file: "src/crypto.py",
      line: 81,
      language: "Python",

      riskScore: 91,
      severity: "Critical",

      keySize: "56-bit",

      recommendation: {
        algorithm: "AES-256",
        standard: "NIST",
        rationale:
          "Replace deprecated DES encryption with a modern symmetric algorithm.",
      },

      status: "Open",
    },

    {
      id: "finding-003",

      algorithm: "SHA-1",
      artifactType: "Certificate",

      file: "certs/server.crt",
      line: null,

      riskScore: 76,
      severity: "High",

      recommendation: {
        algorithm: "SHA-256",
        standard: "NIST",
        rationale:
          "Replace SHA-1 certificate signatures with SHA-256 or stronger.",
      },

      status: "Open",
    },
  ],
};
