import React from "react";
import { FormattedMessage } from "react-intl";
import { Heading, Section, Tile, Grid, Column } from "@carbon/react";
import {
  Microscope,
  User,
  Settings,
  Report,
  ChartBubble,
  QrCode,
  ContainerSoftware,
  TableOfContents,
} from "@carbon/icons-react";
import "../Style.css";

function AdminDashboard() {
  const adminSections = [
    {
      title: "Test Management",
      description:
        "Configure reflex tests, calculated values, and test catalog",
      icon: Microscope,
      link: "#testManagementConfigMenu",
    },
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: User,
      link: "#userManagement",
    },
    {
      title: "Organization Management",
      description: "Manage organizations and facilities",
      icon: ContainerSoftware,
      link: "#organizationManagement",
    },
    {
      title: "Program Management",
      description: "Manage programs and additional questions",
      icon: ChartBubble,
      link: "#program",
    },
    {
      title: "Menu Configuration",
      description: "Configure application menus and navigation",
      icon: TableOfContents,
      link: "#globalMenuManagement",
    },
    {
      title: "Barcode Configuration",
      description: "Configure barcode formats and labels",
      icon: QrCode,
      link: "#barcodeConfiguration",
    },
    {
      title: "Result Reporting",
      description: "Configure result reporting and notifications",
      icon: Report,
      link: "#resultReportingConfiguration",
    },
    {
      title: "General Configuration",
      description: "Configure application properties and settings",
      icon: Settings,
      link: "#commonproperties",
    },
  ];

  return (
    <div className="adminPageContent" style={{ padding: "2rem" }}>
      <Section>
        <Heading style={{ textAlign: "center" }}>
          <FormattedMessage
            id="admin.dashboard.title"
            defaultMessage="Administration Dashboard"
          />
        </Heading>
        <p
          style={{
            marginTop: "1rem",
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          <FormattedMessage
            id="admin.dashboard.description"
            defaultMessage="Select an option from the sidebar to begin managing system settings, or choose a quick action below."
          />
        </p>

        <Grid>
          {adminSections.map((section, index) => (
            <Column key={index} lg={8} md={8} sm={4}>
              <Tile
                style={{
                  marginBottom: "1rem",
                  cursor: "pointer",
                  minHeight: "150px",
                }}
                onClick={() => (window.location.hash = section.link)}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1rem",
                  }}
                >
                  <section.icon size={32} style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ marginBottom: "0.5rem" }}>{section.title}</h4>
                    <p style={{ color: "var(--cds-text-secondary)" }}>
                      {section.description}
                    </p>
                  </div>
                </div>
              </Tile>
            </Column>
          ))}
        </Grid>
      </Section>
    </div>
  );
}

export default AdminDashboard;
