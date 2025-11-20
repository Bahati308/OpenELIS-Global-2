package org.openelisglobal.inventory.controller.rest;

import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;
import org.openelisglobal.common.action.IActionConstants;
import org.openelisglobal.common.log.LogEvent;
import org.openelisglobal.common.util.DateUtil;
import org.openelisglobal.common.util.IdValuePair;
import org.openelisglobal.inventory.action.InventoryUtility;
import org.openelisglobal.inventory.form.InventoryKitItem;
import org.openelisglobal.inventory.service.InventoryItemService;
import org.openelisglobal.inventory.service.InventoryLocationService;
import org.openelisglobal.inventory.service.InventoryReceiptService;
import org.openelisglobal.inventory.valueholder.InventoryItem;
import org.openelisglobal.inventory.valueholder.InventoryLocation;
import org.openelisglobal.inventory.valueholder.InventoryReceipt;
import org.openelisglobal.login.valueholder.UserSessionData;
import org.openelisglobal.organization.service.OrganizationService;
import org.openelisglobal.organization.valueholder.Organization;
import org.openelisglobal.spring.util.SpringContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/rest/inventory")
public class InventoryRestController {

    @Autowired
    private InventoryItemService inventoryItemService;

    @Autowired
    private InventoryLocationService inventoryLocationService;

    @Autowired
    private InventoryReceiptService inventoryReceiptService;

    @Autowired
    private OrganizationService organizationService;

    private String getSysUserId(HttpServletRequest request) {
        UserSessionData usd = (UserSessionData) request.getSession().getAttribute(IActionConstants.USER_SESSION_DATA);
        if (usd == null) {
            usd = (UserSessionData) request.getAttribute(IActionConstants.USER_SESSION_DATA);
            if (usd == null) {
                return "1"; // Default system user ID
            }
        }
        return String.valueOf(usd.getSystemUserId());
    }

    @GetMapping
    public ResponseEntity<InventoryResponse> getInventory() {
        try {
            InventoryUtility utility = SpringContext.getBean(InventoryUtility.class);
            List<InventoryKitItem> inventoryItems = utility.getExistingInventory();
            List<String> kitTypes = getTestKitTypes();
            List<IdValuePair> sources = getSources();

            InventoryResponse response = new InventoryResponse();
            response.setInventoryItems(inventoryItems);
            response.setKitTypes(kitTypes);
            response.setSources(sources);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            LogEvent.logError(e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<String> saveInventory(@RequestBody InventorySaveRequest request,
            HttpServletRequest httpRequest) {
        try {
            String sysUserId = getSysUserId(httpRequest);

            // Process modified items
            if (request.getModifiedItems() != null) {
                for (InventoryKitItem kitItem : request.getModifiedItems()) {
                    updateInventorySet(kitItem, sysUserId);
                }
            }

            // Process new items
            if (request.getNewItems() != null) {
                for (InventoryKitItem kitItem : request.getNewItems()) {
                    // Check for duplicate names
                    List<InventoryItem> existingItems = inventoryItemService.getAllInventoryItems();
                    for (InventoryItem existingItem : existingItems) {
                        if (existingItem.getName().equals(kitItem.getKitName())) {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("Duplicate inventory item name: " + kitItem.getKitName());
                        }
                    }

                    createInventorySet(kitItem, sysUserId);
                }
            }

            return ResponseEntity.ok("Inventory saved successfully");
        } catch (Exception e) {
            LogEvent.logError(e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error saving inventory: " + e.getMessage());
        }
    }

    private void updateInventorySet(InventoryKitItem kitItem, String sysUserId) {
        // Update InventoryItem
        InventoryItem item = new InventoryItem();
        item.setId(kitItem.getInventoryItemId());
        item.setIsActive(kitItem.getIsActive() ? "Y" : "N");
        item.setDescription(kitItem.getType());
        item.setName(kitItem.getKitName());
        item.setSysUserId(sysUserId);
        inventoryItemService.update(item);

        // Update InventoryLocation
        InventoryLocation location = new InventoryLocation();
        location.setId(kitItem.getInventoryLocationId());
        location.setExpirationDate(DateUtil.convertStringDateToTruncatedTimestamp(kitItem.getExpirationDate()));
        location.setLotNumber(kitItem.getLotNumber());
        location.setSysUserId(sysUserId);
        location.setInventoryItem(item);
        inventoryLocationService.update(location);

        // Update InventoryReceipt
        Organization organization = new Organization();
        organization.setId(kitItem.getOrganizationId());
        organizationService.getData(organization);

        InventoryReceipt receipt = new InventoryReceipt();
        receipt.setId(kitItem.getInventoryReceiptId());
        receipt.setOrganization(organization);
        receipt.setInventoryItemId(kitItem.getInventoryItemId());
        receipt.setReceivedDate(DateUtil.convertStringDateToTruncatedTimestamp(kitItem.getReceiveDate()));
        receipt.setSysUserId(sysUserId);
        inventoryReceiptService.update(receipt);
    }

    private void createInventorySet(InventoryKitItem kitItem, String sysUserId) {
        // Create InventoryItem
        InventoryItem item = new InventoryItem();
        item.setIsActive("Y");
        item.setDescription(kitItem.getType());
        item.setName(kitItem.getKitName());
        item.setSysUserId(sysUserId);
        inventoryItemService.insert(item);

        String itemId = item.getId();

        // Create InventoryLocation
        InventoryLocation location = new InventoryLocation();
        location.setExpirationDate(DateUtil.convertStringDateToTruncatedTimestamp(kitItem.getExpirationDate()));
        location.setLotNumber(kitItem.getLotNumber());
        location.setSysUserId(sysUserId);
        location.setInventoryItem(item);
        inventoryLocationService.insert(location);

        // Create InventoryReceipt
        Organization organization = new Organization();
        organization.setId(kitItem.getOrganizationId());
        organizationService.getData(organization);

        InventoryReceipt receipt = new InventoryReceipt();
        receipt.setOrganization(organization);
        receipt.setInventoryItemId(itemId);
        receipt.setReceivedDate(DateUtil.convertStringDateToTruncatedTimestamp(kitItem.getReceiveDate()));
        receipt.setSysUserId(sysUserId);
        inventoryReceiptService.insert(receipt);
    }

    private List<String> getTestKitTypes() {
        List<String> types = new ArrayList<>();
        types.add(InventoryUtility.HIV);
        types.add(InventoryUtility.SYPHILIS);
        return types;
    }

    private List<IdValuePair> getSources() {
        List<IdValuePair> sources = new ArrayList<>();
        List<Organization> organizations = organizationService.getOrganizationsByTypeName("organizationName",
                "TestKitVender");

        for (Organization organization : organizations) {
            sources.add(new IdValuePair(organization.getId(), organization.getOrganizationName()));
        }

        return sources;
    }

    // Response classes
    public static class InventoryResponse {
        private List<InventoryKitItem> inventoryItems;
        private List<String> kitTypes;
        private List<IdValuePair> sources;

        public List<InventoryKitItem> getInventoryItems() {
            return inventoryItems;
        }

        public void setInventoryItems(List<InventoryKitItem> inventoryItems) {
            this.inventoryItems = inventoryItems;
        }

        public List<String> getKitTypes() {
            return kitTypes;
        }

        public void setKitTypes(List<String> kitTypes) {
            this.kitTypes = kitTypes;
        }

        public List<IdValuePair> getSources() {
            return sources;
        }

        public void setSources(List<IdValuePair> sources) {
            this.sources = sources;
        }
    }

    public static class InventorySaveRequest {
        private List<InventoryKitItem> modifiedItems;
        private List<InventoryKitItem> newItems;

        public List<InventoryKitItem> getModifiedItems() {
            return modifiedItems;
        }

        public void setModifiedItems(List<InventoryKitItem> modifiedItems) {
            this.modifiedItems = modifiedItems;
        }

        public List<InventoryKitItem> getNewItems() {
            return newItems;
        }

        public void setNewItems(List<InventoryKitItem> newItems) {
            this.newItems = newItems;
        }
    }
}
