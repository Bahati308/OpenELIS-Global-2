import React, { useState, useEffect, useContext } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Button,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TextInput,
  Select,
  SelectItem,
  Loading,
  TableContainer,
  Section,
  Heading,
} from "@carbon/react";
import { Add, TrashCan } from "@carbon/icons-react";
import { NotificationContext } from "../layout/Layout";
import { AlertDialog, NotificationKinds } from "../common/CustomNotification";
import {
  getFromOpenElisServer,
  postToOpenElisServerJsonResponse,
} from "../utils/Utils";
import config from "../../config.json";
import PageBreadCrumb from "../common/PageBreadCrumb";

function ManageInventory() {
  const intl = useIntl();
  const { notificationVisible, setNotificationVisible, addNotification } =
    useContext(NotificationContext);

  const [inventoryData, setInventoryData] = useState({
    inventoryItems: [],
    kitTypes: [],
    sources: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [modifiedRows, setModifiedRows] = useState(new Set());
  const [newRows, setNewRows] = useState([]);
  const [deletedNewRowIds, setDeletedNewRowIds] = useState(new Set());

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = () => {
    setIsLoading(true);
    getFromOpenElisServer("/rest/inventory", (response) => {
      if (response) {
        setInventoryData(response);
      }
      setIsLoading(false);
    });
  };

  const handleCellChange = (rowId, field, value) => {
    setInventoryData((prevData) => ({
      ...prevData,
      inventoryItems: prevData.inventoryItems.map((item, index) => {
        if (index === rowId) {
          setModifiedRows((prev) => new Set([...prev, rowId]));
          return { ...item, [field]: value, isModified: true };
        }
        return item;
      }),
    }));
  };

  const handleNewRowChange = (rowId, field, value) => {
    setNewRows((prevRows) =>
      prevRows.map((row) =>
        row.tempId === rowId ? { ...row, [field]: value } : row,
      ),
    );
  };

  const addNewKit = () => {
    const newRow = {
      tempId: `new_${Date.now()}`,
      inventoryLocationId: "",
      kitName: "",
      type: "",
      receiveDate: "",
      expirationDate: "",
      lotNumber: "",
      organizationId: "",
      isActive: true,
    };
    setNewRows([...newRows, newRow]);
  };

  const removeNewKit = (tempId) => {
    setNewRows(newRows.filter((row) => row.tempId !== tempId));
    setDeletedNewRowIds((prev) => new Set([...prev, tempId]));
  };

  const toggleActive = (rowId) => {
    setInventoryData((prevData) => ({
      ...prevData,
      inventoryItems: prevData.inventoryItems.map((item, index) => {
        if (index === rowId) {
          setModifiedRows((prev) => new Set([...prev, rowId]));
          return { ...item, isActive: !item.isActive, isModified: true };
        }
        return item;
      }),
    }));
  };

  const validateData = () => {
    // Validate existing items
    for (const [index, item] of inventoryData.inventoryItems.entries()) {
      if (modifiedRows.has(index)) {
        if (!item.kitName || item.kitName.trim() === "") {
          addNotification({
            kind: NotificationKinds.error,
            title: intl.formatMessage({ id: "notification.title" }),
            message: intl.formatMessage({
              id: "inventory.error.name.required",
            }),
          });
          return false;
        }
        if (!item.organizationId || item.organizationId.trim() === "") {
          addNotification({
            kind: NotificationKinds.error,
            title: intl.formatMessage({ id: "notification.title" }),
            message: intl.formatMessage({
              id: "inventory.error.source.required",
            }),
          });
          return false;
        }
      }
    }

    // Validate new items
    for (const item of newRows) {
      if (!item.kitName || item.kitName.trim() === "") {
        addNotification({
          kind: NotificationKinds.error,
          title: intl.formatMessage({ id: "notification.title" }),
          message: intl.formatMessage({
            id: "inventory.error.name.required",
          }),
        });
        return false;
      }
      if (!item.organizationId || item.organizationId.trim() === "") {
        addNotification({
          kind: NotificationKinds.error,
          title: intl.formatMessage({ id: "notification.title" }),
          message: intl.formatMessage({
            id: "inventory.error.source.required",
          }),
        });
        return false;
      }
    }

    return true;
  };

  const handleSave = () => {
    if (!validateData()) {
      return;
    }

    const modifiedItems = inventoryData.inventoryItems.filter((item, index) =>
      modifiedRows.has(index),
    );

    const saveData = {
      modifiedItems,
      newItems: newRows,
    };

    setIsLoading(true);
    postToOpenElisServerJsonResponse(
      "/rest/inventory",
      JSON.stringify(saveData),
      (response) => {
        addNotification({
          kind: NotificationKinds.success,
          title: intl.formatMessage({ id: "notification.title" }),
          message: intl.formatMessage({ id: "save.success.message" }),
        });
        setModifiedRows(new Set());
        setNewRows([]);
        loadInventoryData();
      },
      (error) => {
        addNotification({
          kind: NotificationKinds.error,
          title: intl.formatMessage({ id: "notification.title" }),
          message:
            error.responseText ||
            intl.formatMessage({ id: "error.save.message" }),
        });
        setIsLoading(false);
      },
    );
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
      key: "type",
      header: intl.formatMessage({ id: "inventory.testKit.type" }),
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
    {
      key: "actions",
      header: "",
    },
  ];

  const activeItems = inventoryData.inventoryItems.filter(
    (item) => item.isActive,
  );
  const inactiveItems = inventoryData.inventoryItems.filter(
    (item) => !item.isActive,
  );

  return (
    <>
      <PageBreadCrumb
        breadcrumbs={[
          { label: "home.label", link: "/" },
          { label: "inventory.manage.title", link: "/ManageInventory" },
        ]}
      />
      <div className="adminPageContent">
        <Section>
          <Heading>
            <FormattedMessage id="inventory.manage.title" />
          </Heading>
        </Section>

        {notificationVisible && <AlertDialog />}

        {isLoading ? (
          <Loading />
        ) : (
          <>
            <Section>
              <TableContainer
                title={intl.formatMessage({ id: "inventory.testKit.active" })}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader key={header.key}>
                          {header.header}
                          {(header.key === "kitName" ||
                            header.key === "source") && (
                            <span className="requiredlabel">*</span>
                          )}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeItems.map((item, index) => {
                      const originalIndex =
                        inventoryData.inventoryItems.indexOf(item);
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <TextInput
                              id={`id-${index}`}
                              value={item.inventoryLocationId || ""}
                              disabled
                              labelText=""
                            />
                          </TableCell>
                          <TableCell>
                            <TextInput
                              id={`name-${index}`}
                              value={item.kitName || ""}
                              onChange={(e) =>
                                handleCellChange(
                                  originalIndex,
                                  "kitName",
                                  e.target.value,
                                )
                              }
                              labelText=""
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              id={`type-${index}`}
                              value={item.type || ""}
                              onChange={(e) =>
                                handleCellChange(
                                  originalIndex,
                                  "type",
                                  e.target.value,
                                )
                              }
                              labelText=""
                            >
                              <SelectItem value="" text="" />
                              {inventoryData.kitTypes.map((type) => (
                                <SelectItem
                                  key={type}
                                  value={type}
                                  text={type}
                                />
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell>
                            <TextInput
                              id={`receive-${index}`}
                              type="date"
                              value={item.receiveDate || ""}
                              onChange={(e) =>
                                handleCellChange(
                                  originalIndex,
                                  "receiveDate",
                                  e.target.value,
                                )
                              }
                              labelText=""
                            />
                          </TableCell>
                          <TableCell>
                            <TextInput
                              id={`expiration-${index}`}
                              type="date"
                              value={item.expirationDate || ""}
                              onChange={(e) =>
                                handleCellChange(
                                  originalIndex,
                                  "expirationDate",
                                  e.target.value,
                                )
                              }
                              labelText=""
                            />
                          </TableCell>
                          <TableCell>
                            <TextInput
                              id={`lot-${index}`}
                              value={item.lotNumber || ""}
                              onChange={(e) =>
                                handleCellChange(
                                  originalIndex,
                                  "lotNumber",
                                  e.target.value,
                                )
                              }
                              labelText=""
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              id={`source-${index}`}
                              value={item.organizationId || ""}
                              onChange={(e) =>
                                handleCellChange(
                                  originalIndex,
                                  "organizationId",
                                  e.target.value,
                                )
                              }
                              labelText=""
                            >
                              <SelectItem value="" text="" />
                              {inventoryData.sources.map((source) => (
                                <SelectItem
                                  key={source.id}
                                  value={source.id}
                                  text={source.value}
                                />
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              kind="danger--tertiary"
                              size="sm"
                              onClick={() => toggleActive(originalIndex)}
                            >
                              <FormattedMessage id="label.button.deactivate" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {newRows.map((row, index) => (
                      <TableRow key={row.tempId}>
                        <TableCell>
                          <TextInput
                            id={`new-id-${index}`}
                            value=""
                            disabled
                            labelText=""
                          />
                        </TableCell>
                        <TableCell>
                          <TextInput
                            id={`new-name-${index}`}
                            value={row.kitName || ""}
                            onChange={(e) =>
                              handleNewRowChange(
                                row.tempId,
                                "kitName",
                                e.target.value,
                              )
                            }
                            labelText=""
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            id={`new-type-${index}`}
                            value={row.type || ""}
                            onChange={(e) =>
                              handleNewRowChange(
                                row.tempId,
                                "type",
                                e.target.value,
                              )
                            }
                            labelText=""
                          >
                            <SelectItem value="" text="" />
                            {inventoryData.kitTypes.map((type) => (
                              <SelectItem key={type} value={type} text={type} />
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <TextInput
                            id={`new-receive-${index}`}
                            type="date"
                            value={row.receiveDate || ""}
                            onChange={(e) =>
                              handleNewRowChange(
                                row.tempId,
                                "receiveDate",
                                e.target.value,
                              )
                            }
                            labelText=""
                          />
                        </TableCell>
                        <TableCell>
                          <TextInput
                            id={`new-expiration-${index}`}
                            type="date"
                            value={row.expirationDate || ""}
                            onChange={(e) =>
                              handleNewRowChange(
                                row.tempId,
                                "expirationDate",
                                e.target.value,
                              )
                            }
                            labelText=""
                          />
                        </TableCell>
                        <TableCell>
                          <TextInput
                            id={`new-lot-${index}`}
                            value={row.lotNumber || ""}
                            onChange={(e) =>
                              handleNewRowChange(
                                row.tempId,
                                "lotNumber",
                                e.target.value,
                              )
                            }
                            labelText=""
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            id={`new-source-${index}`}
                            value={row.organizationId || ""}
                            onChange={(e) =>
                              handleNewRowChange(
                                row.tempId,
                                "organizationId",
                                e.target.value,
                              )
                            }
                            labelText=""
                          >
                            <SelectItem value="" text="" />
                            {inventoryData.sources.map((source) => (
                              <SelectItem
                                key={source.id}
                                value={source.id}
                                text={source.value}
                              />
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            kind="danger--ghost"
                            size="sm"
                            renderIcon={TrashCan}
                            iconDescription={intl.formatMessage({
                              id: "label.button.remove",
                            })}
                            onClick={() => removeNewKit(row.tempId)}
                            hasIconOnly
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <div style={{ marginTop: "1rem" }}>
                <Button
                  kind="tertiary"
                  size="sm"
                  renderIcon={Add}
                  onClick={addNewKit}
                >
                  <FormattedMessage id="inventory.testKit.add" />
                </Button>
                <Button
                  kind="tertiary"
                  size="sm"
                  onClick={() => setShowInactive(!showInactive)}
                  style={{ marginLeft: "1rem" }}
                >
                  {showInactive ? (
                    <FormattedMessage id="inventory.testKit.hideInactive" />
                  ) : (
                    <FormattedMessage id="inventory.testKit.showAll" />
                  )}
                </Button>
              </div>
            </Section>

            {showInactive && inactiveItems.length > 0 && (
              <Section>
                <TableContainer
                  title={intl.formatMessage({
                    id: "invnetory.testKit.inactiveKits",
                  })}
                >
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
                      {inactiveItems.map((item, index) => {
                        const originalIndex =
                          inventoryData.inventoryItems.indexOf(item);
                        return (
                          <TableRow key={index}>
                            <TableCell>{item.inventoryLocationId}</TableCell>
                            <TableCell>{item.kitName}</TableCell>
                            <TableCell>{item.type}</TableCell>
                            <TableCell>{item.receiveDate}</TableCell>
                            <TableCell>{item.expirationDate}</TableCell>
                            <TableCell>{item.lotNumber}</TableCell>
                            <TableCell>{item.source}</TableCell>
                            <TableCell>
                              <Button
                                kind="tertiary"
                                size="sm"
                                onClick={() => toggleActive(originalIndex)}
                              >
                                <FormattedMessage id="label.button.reactivate" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Section>
            )}

            <Section>
              <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
                <Button onClick={handleSave}>
                  <FormattedMessage id="label.button.save" />
                </Button>
                <Button kind="secondary" onClick={() => window.history.back()}>
                  <FormattedMessage id="label.button.cancel" />
                </Button>
              </div>
            </Section>
          </>
        )}
      </div>
    </>
  );
}

export default ManageInventory;
