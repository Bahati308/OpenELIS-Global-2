import React, { useState, useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Loading,
  TableContainer,
  Section,
  Heading,
} from "@carbon/react";
import { getFromOpenElisServer } from "../utils/Utils";
import PageBreadCrumb from "../common/PageBreadCrumb";

function DisplayInventory() {
  const intl = useIntl();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = () => {
    setIsLoading(true);
    getFromOpenElisServer("/rest/inventory", (response) => {
      if (response && response.inventoryItems) {
        // Only show active items
        const activeItems = response.inventoryItems.filter(
          (item) => item.isActive,
        );
        setInventoryItems(activeItems);
      }
      setIsLoading(false);
    });
  };

  const headers = [
    {
      key: "inventoryLocationId",
      header: intl.formatMessage({ id: "inventory.testKit.id" }),
    },
    {
      key: "kitName",
      header: intl.formatMessage({ id: "inventory.testKit.name" }),
    },
    {
      key: "receiveDate",
      header: intl.formatMessage({ id: "inventory.testKit.receiveDate" }),
    },
    {
      key: "expirationDate",
      header: intl.formatMessage({ id: "inventory.testKit.expiration" }),
    },
    {
      key: "lotNumber",
      header: intl.formatMessage({ id: "inventory.testKit.lot" }),
    },
    {
      key: "source",
      header: intl.formatMessage({ id: "inventory.testKit.source" }),
    },
  ];

  return (
    <>
      <PageBreadCrumb
        breadcrumbs={[
          { label: "home.label", link: "/" },
          { label: "inventory.display.title", link: "/DisplayInventory" },
        ]}
      />
      <div className="adminPageContent">
        <Section>
          <Heading>
            <FormattedMessage id="inventory.display.title" />
          </Heading>
        </Section>

        {isLoading ? (
          <Loading />
        ) : inventoryItems.length > 0 ? (
          <Section>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader key={header.key}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventoryItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.inventoryLocationId}</TableCell>
                      <TableCell>{item.kitName}</TableCell>
                      <TableCell>{item.receiveDate}</TableCell>
                      <TableCell>{item.expirationDate}</TableCell>
                      <TableCell>{item.lotNumber}</TableCell>
                      <TableCell>{item.source}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Section>
        ) : (
          <Section>
            <p>
              <FormattedMessage id="inventory.testKit.none" />
            </p>
          </Section>
        )}
      </div>
    </>
  );
}

export default DisplayInventory;
