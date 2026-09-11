export const reports = [
    {
      id: 1,
      name: "banking-system",
      version: "v2.4.1",
      date: "Aug 22, 2026",
      generated: "Aug 22, 2026, 14:32 UTC",
      findings: 47,
      severity: "High",
      status: "Completed",
  
      summary:
        "The scan of banking-system revealed critical cryptographic vulnerabilities primarily centered around the use of deprecated hashing algorithms (SHA-1) in legacy authentication modules and weak TLS configurations. Immediate remediation is required to maintain compliance.",
  
      migration: [
        "Upgrade 14 instances of SHA-1 to SHA-256 or SHA-3 in auth_service.py.",
        "Enforce TLS 1.3 across all internal microservice communications.",
        "Rotate 3 hardcoded symmetric keys found in configuration files.",
      ],
    },
  
    {
      id: 2,
      name: "payment-service",
      version: "v1.8.2",
      date: "Aug 21, 2026",
      generated: "Aug 21, 2026, 11:18 UTC",
      findings: 12,
      severity: "Medium",
      status: "Completed",
  
      summary:
        "The scan of payment-service identified several cryptographic configuration issues requiring remediation to maintain secure payment processing and compliance.",
  
      migration: [
        "Replace deprecated cryptographic algorithms in payment processing modules.",
        "Enforce TLS 1.3 for payment-service communications.",
        "Review and rotate exposed cryptographic keys.",
      ],
    },
  ];