/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comstenggbtp/ptp-ui/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
