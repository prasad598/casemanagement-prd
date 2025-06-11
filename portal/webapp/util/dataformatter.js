sap.ui.define([], function () {
	var dataformatter = ("ap.portal.utils.dataformatter", {
		isWebIDE: (window.location.host.indexOf("webide") > -1),

		// ✅ New Function Added Here
		getSenderName: function (userType, context) {
			const userName = context.getProperty("userName");
			if (userType === "PTP Normal Task") {
				return "PTP";
			} else {
				return userName;
			}
		},

		/**
		 * Format Billing User Requests Data
		 */
		formatUserRequests: function (dataSet, userInfo) {
			// ... [rest of your code remains unchanged]
