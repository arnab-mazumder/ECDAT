# ECDAT - Enterprise Cryptographic Discovery & Analysis Tool

ECDAT is an enterprise security dashboard for cryptographic inventory discovery, quantum readiness assessment, and vulnerability remediation.

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher

### Installation & Local Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-org/ecdat2026.git
   cd ecdat2026
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🏗 Architecture & File Structure

This project follows a strict **Feature-Based Modular Architecture** combined with Next.js App Router.

```text
src/
│
├── app/                         # Next.js Routing ONLY (lightweight page entry points)
│   ├── layout.js                # App shell (Sidebar + Main Content area)
│   ├── page.js                  # Entry route (renders Dashboard)
│   ├── globals.css              # Global tokens, resets, sidebar, & app layout styles
│   ├── dashboard/page.js        # /dashboard route
│   ├── scan/page.js             # /scan route
│   ├── findings/page.js         # /findings route
│   ├── workspace/page.js        # /workspace route
│   ├── validation/page.js       # /validation route
│   └── reports/page.js          # /reports route
│
├── features/                    # Feature-specific modular code
│   ├── dashboard/
│   │   ├── components/          # Components USED ONLY inside Dashboard
│   │   │   ├── RiskCard.js
│   │   │   ├── RiskDistribution.js
│   │   │   └── PriorityFindings.js
│   │   ├── dashboard.css        # Dashboard-specific styling
│   │   └── data.js              # Dashboard data accessor
│   │
│   ├── scan/                    # Scan feature module
│   ├── findings/                # Findings feature module
│   ├── workspace/               # Workspace feature module
│   ├── validation/              # Validation feature module
│   └── reports/                 # Reports feature module
│
├── components/                  # TRULY SHARED reusable components across pages
│   ├── layout/
│   │   ├── Sidebar.js           # Shared navigation sidebar
│   │   └── Header.js            # Shared page header
│   └── ui/
│       ├── Button.js            # Base button component
│       ├── Badge.js             # Severity & risk badge component
│       ├── Card.js              # Container card component
│       └── Modal.js             # Modal dialog component
│
└── lib/                         # Global shared utilities & mock data
    ├── mockData.js              # Single source of truth (mockScan)
    ├── api.js                   # Shared API accessor functions
    └── constants.js             # Color schemes, severity levels, & nav items
```

---

## 🛠 Developer Guide: How to Create New Feature Pages

When assigned a new page (e.g. `Scan`, `Findings`, `Code Workspace`, `Validation`, or `Reports`), follow this step-by-step workflow:

### 1. Differentiate Component Scope
- **Page-specific Components**: If a component is *only* used within your page, place it under `src/features/<your-feature>/components/`.
- **Shared Components**: If a widget or component is used by 2 or more features (e.g., buttons, badges, modals, input fields), place or import it from `src/components/ui/`.

### 2. Step-by-Step Feature Implementation Workflow

#### Step 1: Create your Feature Directory
Create a folder inside `src/features/` matching your page name:
```bash
src/features/findings/
├── components/
│   ├── FindingsTable.js
│   └── FindingsFilters.js
├── findings.css
└── data.js
```

#### Step 2: Access the Shared `mockScan` Data
Import the central dataset from `@/lib/mockData` or `@/lib/api` to maintain consistency across the entire team:
```javascript
import { mockScan } from "@/lib/mockData";
import { getMockScan } from "@/lib/api";

export async function getFindingsData() {
  const scan = await getMockScan();
  return scan.findings; // Returns all 47 findings
}
```

#### Step 3: Keep `src/app/` Pages Lightweight
Routes in `src/app/<feature>/page.js` should **only** fetch data and assemble components:
```javascript
// src/app/findings/page.js
import Header from "@/components/layout/Header";
import FindingsTable from "@/features/findings/components/FindingsTable";
import { getFindingsData } from "@/features/findings/data";
import "@/features/findings/findings.css";

export default async function FindingsPage() {
  const findings = await getFindingsData();

  return (
    <div className="findings-container">
      <FindingsTable findings={findings} />
    </div>
  );
}
```

---

## 📊 Shared Mock Data Schema (`mockScan`)

All team members must read from `mockScan` in `src/lib/mockData.js`:

```javascript
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
    severity: { critical: 8, high: 14, medium: 17, low: 8 },
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
      recommendation: {
        algorithm: "ML-KEM-768",
        standard: "NIST FIPS 203",
        rationale: "Migrate to a quantum-resistant key establishment mechanism.",
      },
      code: {
        vulnerable: "key = RSA.generate(1024)",
        suggested: "key = ml_kem_generate_keypair()",
      },
      status: "Open",
    },
    // ...
  ]
};
```

---

## 🎨 Design Guidelines & Conventions

- **Colors & Badges**: Always use `SEVERITY_COLORS` or `<Badge score={...} severity={...} />` from `@/components/ui/Badge` to maintain consistent risk color badges (Red for Critical, Slate/Grey outline for High).
- **Icons**: Use `lucide-react` for standard UI icons.
- **Routing**: Keep Next.js App Router files (`src/app/**/page.js`) free of heavy visual logic; delegate rendering to feature components in `src/features/`.
