"use client";

import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function PriorityFindings({ findings = [] }) {
  return (
    <Card className="priority-findings-card">
      <div className="findings-header">
        <h2 className="findings-title">Highest Priority Findings</h2>
        {findings.length > 0 && (
          <Link href="/findings" className="view-all-link">
            <span>VIEW ALL</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        )}
      </div>

      <div className="table-responsive">
        {findings.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
            No priority cryptographic findings to display.
          </div>
        ) : (
          <table className="findings-table">
            <thead>
              <tr>
                <th>ALGORITHM</th>
                <th>LOCATION</th>
                <th>TYPE</th>
                <th>RISK</th>
                <th>RECOMMENDATION</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((item) => (
                <tr key={item.id}>
                  <td className="font-semibold text-algorithm">
                    {item.algorithm}
                  </td>
                  <td className="location-cell">
                    <code>{item.location}</code>
                  </td>
                  <td className="text-type">{item.type}</td>
                  <td>
                    <Badge score={item.riskScore} severity={item.severity} />
                  </td>
                  <td className="font-semibold text-recommendation">
                    {item.recommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}
