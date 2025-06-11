sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "ap/portal/model/models",
    "sap/ui/model/json/JSONModel"
],
function (UIComponent, Device, models, JSONModel) {
    "use strict";

    return UIComponent.extend("ap.portal.Component", {
        metadata: {
            manifest: "json"
        },

        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
         * @public
         * @override
         */
        init: function () {
            var that = this;

            // Call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // Enable routing (DO THIS AFTER THE MODEL IS LOADED)
            this.getRouter().initialize();

            // Set the device model
            this.setModel(models.createDeviceModel(), "device");

            // Load Maintenance Configuration
            var oMaintenanceModel = new JSONModel();
            oMaintenanceModel.attachRequestCompleted(function () {
                var oData = oMaintenanceModel.getData();
                
                if (!oData || !oData.startDate || !oData.endDate) {
                    console.error("Maintenance configuration is missing required fields.");
                    return;
                }

                var now = new Date();
                var startDate = new Date(oData.startDate);
                var endDate = new Date(oData.endDate);
                var warningDays = oData.warningDays || 5;

                var warningStartDate = new Date(startDate);
                warningStartDate.setDate(startDate.getDate() - warningDays);

                // Determine Maintenance Status
                var isMaintenanceActive = now >= startDate && now <= endDate;
                var isWarningActive = now >= warningStartDate && now < startDate;

                // Set Global Maintenance Model
                var oMaintenanceStatus = {
                    isMaintenanceActive: isMaintenanceActive,
                    isWarningActive: isWarningActive,
                    message: oData.message
                };

                that.setModel(new JSONModel(oMaintenanceStatus), "maintenance");

                // If maintenance is active, redirect to maintenance page
                if (isMaintenanceActive) {
                    that.getRouter().navTo("Maintenance");
                }
            });

            oMaintenanceModel.loadData("./model/maintenanceConfig.json");
        }
    });
});
