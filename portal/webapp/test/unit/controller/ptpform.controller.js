/*global QUnit*/

sap.ui.define([
	"comstenggbtp/ptp-ui/controller/ptpform.controller"
], function (Controller) {
	"use strict";

	QUnit.module("ptpform Controller");

	QUnit.test("I should test the ptpform controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
