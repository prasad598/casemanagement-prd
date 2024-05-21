sap.ui.define([
	"sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "../util/dataformatter", "../model/service", "sap/m/MessageToast",
	"../model/ExtendedValueHelp", "sap/ui/core/ValueState", "sap/ui/core/Fragment", "../util/configuration", "sap/m/Dialog",
	"sap/m/MessageBox", "sap/m/ActionSheet", "sap/m/Button", "sap/ui/model/Filter"
], function (Controller, JSONModel, Formatter, Service, MessageToast, ExtendedValueHelp, ValueState, Fragment, Config, Dialog, MessageBox,
	ActionSheet, Button, Filter) {
	"use strict";

	return Controller.extend("com.stengg.btp.ptpui.controller.ptpform", {
		isInitial: true,
		onInit: function () {
			// this.getUserDetails();
			this.getAllUserRequestsNDetails();
			this.oMessagePopover = this.getView().byId("messagePopOverId");
			// Entity Loads
			var selectedSector = "ENTITY";
			var oEntityModel = this.modelAssignment("oEntityModel");
			var entityList = this.loadBUList(selectedSector);
					var entityElement = {
						"code": "",
						"desc": ""
					};
			entityList.unshift(entityElement);
			oEntityModel.setProperty("/EntityList", entityList);

		},

		getRequests : function(){
			this.getAllUserRequestsNDetails();
			this.oMessagePopover = this.getView().byId("messagePopOverId");
			// Entity Loads
			var selectedSector = "ENTITY";
			var oEntityModel = this.modelAssignment("oEntityModel");
			// var entityList = this.loadBUList(selectedSector);
			var buModel = new JSONModel();
			// var sServiceUrl = Config.dbOperations.loadLookupData + vendorSector;
			var sServiceUrl = "/poutil/rest/PTP/retrievePTPLookup/"+selectedSector; 
			buModel.loadData(this.getModulePath()+sServiceUrl, null, false);

			//Success call Back
			buModel.attachRequestCompleted(null, function (jsonData) {
				var entityElement = {
					"code": "",
					"desc": ""
				};
				jsonData.unshift(entityElement);
				oEntityModel.setProperty("/EntityList", jsonData);			
			});	

		},
		getModulePath: function () {
			var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
			var appPath = appId.replaceAll(".", "/");
			var appModulePath = jQuery.sap.getModulePath(appPath);
			return appModulePath;
		},
		getRequests2 : function(){
			var retrieveModel = new JSONModel();
		    var sServiceUrl = "/poutil/rest/PTP/retrievePTPLookup/ENTITY";
			var oHeader = {
				"Content-Type": "application/json; charset=utf-8"
			};
			retrieveModel.loadData(this.getModulePath() + sServiceUrl, null, true, "GET", false, false, oHeader);

		},
		
		/**
	 * Get Logged In User
	 */
		getLoggedInUser: function () {
			var oModel = new JSONModel();
			var sServiceUrl = Config.processOperations.loggedInUserUrl;
			oModel.loadData(sServiceUrl, null, false);
			return oModel.getData();
		},

		fetchTaskDetail: function (sServiceUrl, caller) {
			var taskDetailModel = new JSONModel();
			taskDetailModel.loadData(this.getModulePath()+sServiceUrl, null, false);
			var taskDetailData = taskDetailModel.getData();
			return taskDetailData;
		},
		/** 
		 * Load BU List 
		 * @param sServiceUrl
		 * @returns
		 */
		loadBUList: function (vendorSector) {
			var buModel = new JSONModel();
			// var sServiceUrl = Config.dbOperations.loadLookupData + vendorSector;
			var sServiceUrl = "/poutil/rest/PTP/retrievePTPLookup/"+vendorSector; 
			buModel.loadData(this.getModulePath()+sServiceUrl, null, false);
			return buModel.getData();
		},
		saveNSubmitServiceRequest: function (requestData,actionType, caller,callBack) {

			var response;
			var sServiceUrl = (requestData.isClarificationReq || requestData.isPendingClose || requestData.cancelVisible) ? Config.dbOperations.saveNSubmitPTPRequestUrl : Config.dbOperations.saveNSubmitRequestUrl;
			var serviceReqModel = new JSONModel();
			var oHeader = {
				"Content-Type": "application/json; charset=utf-8"
			};
			serviceReqModel.loadData(this.getModulePath()+sServiceUrl, JSON.stringify(requestData), true, "POST", false, false, oHeader);
			//Success call Back
			serviceReqModel.attachRequestCompleted(null, function (jsonData) {
				// response = jsonData.getParameter("errorobject");
				response = jsonData.oSource.oData;
				response = (response) ? response : {};
				if(response && response.requestNumber && response.status === "S"){
					requestData.draftId = (requestData.draftId) ? requestData.draftId : response.requestNumber;
					// caller.onAfterSaveCalled(requestData);
				}
				callBack(response);
			});
		},
		/** 
		 * Delete Attachment from File repository and PO DB
		 * @param sServiceUrl
		 * @param caller
		 * @param sPath
		 */
		deleteAttachment: function (sServiceUrl, caller, sPath) {
			var deleteModel = new JSONModel();
			deleteModel.loadData(this.getModulePath()+sServiceUrl, null, false);
			// var response = deleteModel.getData();
			MessageToast.show("Attachment Deleted");
			caller.modelAssignment("oRequestData").getData().attachmentList.splice(sPath, 1);
			caller.modelAssignment("oRequestData").refresh();
			// //Success call Back
			// if (response.status === "S") {

			// } else {
			// 	MessageBox.error(response.message);
			// }
		},

		/**
		 * Delete Draft Request
		 */
		deleteDraftRequest: function (draftNumber) {
			var oModel = new JSONModel();
			var sServiceUrl = Config.dbOperations.deleteDraftRequest + draftNumber;
			// sServiceUrl = sServiceUrl.replace("@filterVal", gstTaxCode);
			oModel.loadData(this.getModulePath()+sServiceUrl, null, false);
			var response = oModel.getData();
			response = (response.d && response.d.results instanceof Array) ? response.d.results[0] : "";
			return response;
		},
		/** 
		 * Cancel BPM process in PO
		 * @param sServiceUrl
		 * @param caller
		 * @param historicalRequestItem
		 */
		cancelProcessinPO: function (sServiceUrl, caller, historicalRequestItem, taskData) {
			var cancelModel = new JSONModel();
			var oHeader = {
				"Content-Type": "application/json; charset=utf-8"
			};
			cancelModel.loadData(this.getModulePath()+sServiceUrl, JSON.stringify(taskData), true, "POST", false, false, oHeader);
			cancelModel.attachRequestCompleted(null, function (jsonData) {
				var response = jsonData.oSource.oData;
				//Success call Back
				if (response && response.status === "S") {

					caller.onAfterProcessCancellation(historicalRequestItem);
				} else {
					MessageToast.show(response.message);
				}
			});
		},
		/**
		 * Post Operation to close task
		 */
		closeTask: function (taskData, callBack) {
			var taskModel = new JSONModel();
			var sServiceUrl = Config.processOperations.massCompleteTaskUrl;
			var oHeader = {
				"Content-Type": "application/json; charset=utf-8"
			};

			taskModel.loadData(this.getModulePath()+sServiceUrl, JSON.stringify({
				"taskCompletionDto": taskData.taskList
			}), true, "POST", false, false, oHeader);
			//Success call Back
			taskModel.attachRequestCompleted(null, function (jsonData) {
				callBack(taskModel.getData());
			});
		},

		initializeLocalModel: function () {
			this.modelAssignment("oReadOnlyModel").setProperty("/isInvoiceVisible", false);
			this.modelAssignment("oReadOnlyModel").setProperty("/isCloseCaseVisible", false);
			this.modelAssignment("oReadOnlyModel").setProperty("/isSaveSubmitVisible", true);
		},

		onLiveSerDetailsChange: function (oEvent) {

			var tempVal = this.getView().byId("caseSummaryId").getValue();

			// console.log("tempVal:::"+tempVal);

			if (tempVal && tempVal.trim().length > 0) {

				this.getView().byId("caseSummaryId").setValueState("None");

			} else {
				this.getView().byId("caseSummaryId").setValueState("Error");

			}

		},

		onLiveInvoiceChange: function (oEvent) {

			var tempVal = this.getView().byId("invoiceNoId").getValue();

			// console.log("tempVal:::"+tempVal);

			if (tempVal && tempVal.trim().length > 0) {

				this.getView().byId("invoiceNoId").setValueState("None");
				// Use Toast for message.

				sap.m.MessageToast.show("More than 3 Invoices Please attach them!");

			} else {
				this.getView().byId("invoiceNoId").setValueState("Error");

			}

		},

		onLiveVendorChange: function (oEvent) {

			var tempVal = this.getView().byId("vendorNameId").getValue();

			// console.log("tempVal:::"+tempVal);

			if (tempVal && tempVal.trim().length > 0) {

				this.getView().byId("vendorNameId").setValueState("None");

			} else {
				this.getView().byId("vendorNameId").setValueState("Error");

			}

		},

		onLiveStaffChange: function (oEvent) {

			var tempVal = this.getView().byId("assignedToId").getValue();

			// console.log("tempVal:::"+tempVal);

			if (tempVal && tempVal.trim().length > 0) {

				this.getView().byId("assignedToId").setValueState("None");

			} else {
				this.getView().byId("assignedToId").setValueState("Error");

			}

		},

		/*
		 * Set Busy Indicators
		 */
		loadBusyIndicator: function (content, isBusy) {
			var pageContent = this.getView().byId(content);
			pageContent = (pageContent) ? pageContent : sap.ui.getCore().byId(content);
			pageContent.setBusy(isBusy);
		},

		/*
		 * Close Message Strip
		 */
		closeMessageStrip: function () {

			var messageModel = this.modelAssignment("oMessageModel");
			
			messageModel.setProperty("/message", "");
			messageModel.setProperty("/type", "Success");
			messageModel.setProperty("/visible", false);
			
		},

		openMessagePopover: function (messageElementArray) {
			var messageElement = {},
				messageModelData = [];
			var messageModel = this.modelAssignment("MessagePopOver");
			$.each(messageElementArray, function (i) {
				messageElement = {};
				messageElement.title = messageElementArray[i];
				messageElement.message = messageElementArray[i];
				messageElement.type = sap.ui.core.MessageType.Error;
				messageModelData.push(messageElement);
			});
			messageModel.setData(messageModelData);
			var showButton = this.getView().byId("MsgalrtBtn");
			showButton.firePress();
		},

		/** 
		 * Validate Data before posting to SAP PO
		 * @returns
		 */

		validatePostData: function () {

			var requestData = {};
			requestData.INFO_STATUS = "InCompleted";

			var isValidData = false;

			// message = [];

			// this.mandatoryCheck();

			if (message && message instanceof Array && message.length > 0) {
				// this.showMessageStrip(message, "Error");
				this.openMessagePopover(message);
				isValidData = false;
			} else if (requestData.INFO_STATUS === "Completed") {
				isValidData = true;
			}
			return isValidData;
		},

		showMessageLogPopover: function (oEvent) {
			if (!this.isMessageOpen) {
				this.oMessagePopover.openBy(oEvent.getSource());
				this.isMessageOpen = true;
			} else {
				this.oMessagePopover.close();
			}
		},

		/** 
		 * Close Message Popover
		 */
		messageAfterClose: function () {
			this.isMessageOpen = false;
			if (this.oMessagePopover.isOpen()) {
				this.oMessagePopover.close();
			}
		},
		onSelectSector: function (oEvent) {
			var selectedSector = (typeof (oEvent) === "string") ? oEvent : (oEvent) ? oEvent.getParameter("selectedItem").getProperty("key") :
				"";
			if (selectedSector) {
				//Retrieve Vendor Sector BU list
				var selectedSectorDesc = (typeof (oEvent) === "string") ? oEvent : (oEvent) ? oEvent.getParameter("selectedItem").getProperty(
						"text") :
					"";
				this.modelAssignment("oRequestData").setProperty("/sectorDesp", selectedSectorDesc);
				var oEntityModel = this.modelAssignment("oEntityModel");
				var vendorSector = oEntityModel.getProperty("/vendorSector");
				if (!vendorSector || (vendorSector && (vendorSector !== selectedSector))) {
					oEntityModel.setProperty("/vendorSector", selectedSector);
					var entityList = this.loadBUList(selectedSector);
					var entityElement = {
						"code": "",
						"desc": ""
					};
					entityList.unshift(entityElement);
					oEntityModel.setProperty("/EntityList", entityList);
				}
			} else {
				var oEntityModel = this.modelAssignment("oEntityModel");
				oEntityModel.setProperty("/EntityList", []);
			}
		},

		onSelectEntity: function (oEvent) {
			var selectedEntityDesc = (typeof (oEvent) === "string") ? oEvent : (oEvent) ? oEvent.getParameter("selectedItem").getProperty(
					"text") :
				"";
			this.modelAssignment("oRequestData").setProperty("/entityName", selectedEntityDesc);
		},

		/**
		 * Get All User Requests and Details
		 */
		onSelectUrgent: function (oEvent) {

			var isSelected = oEvent.getParameter("selected"),
				that = this;
			this.modelAssignment("oRequestData").setProperty("/urgentRequest", isSelected);
			if (isSelected) {
				MessageBox.warning(
					"Please tick if payment is to be made within 2 work days. For urgent payment request, please provide Kofax payment request number.", {
						actions: ["Yes", "No"],
						title: "Is Urgent?",
						onClose: function (sAction) {
							if (sAction == "Yes") {

							} else {
								var view = that.getView();
								var checkBox = view.byId("urgentReq");
								checkBox.setSelected(false);

							}

						}
					}
				);
			}
			// var isSelected = oEvent.getParameter("selected");

			// 	if(isSelected)
			// 	{

			// 	}

		},
		editDraftRequest: function (oEvent) {
			this.initializeLocalModel();
			var actionSource = oEvent.getSource().data("actionSource"),
				isValidTask = true;

			var sPath = (actionSource === "DraftPage") ? oEvent.getSource().oParent.oParent.oBindingContexts.RequestorInfo.sPath : oEvent.getSource()
				.oParent.oBindingContexts.RequestorInfo.sPath;
			var historicalRequestItem = this.modelAssignment("RequestorInfo").getProperty(sPath);
			if (historicalRequestItem.isClarificationReq) {
				isValidTask = false;
				this.modelAssignment("oReadOnlyModel").setProperty("/isFieldEnabled", false);
				isValidTask = this.loadTaskDetails(historicalRequestItem);
				Formatter.formatDataBeforeEdit(historicalRequestItem);
			} else {
				this.modelAssignment("oReadOnlyModel").setProperty("/isFieldEnabled", true);
			}
			this.modelAssignment("oRequestData").setData(historicalRequestItem);
			if (isValidTask) {
				this.handleNav(oEvent);
			} else {
				MessageBox.error("Error Occurred while opening the Task")
			}
		},

		editCloseCase: function (oEvent) {
			this.initializeLocalModel();
			var isValidTask;
			var actionSource = oEvent.getSource().data("actionSource");

			var sPath = (actionSource === "DraftPage") ? oEvent.getSource().oParent.oParent.oBindingContexts.RequestorInfo.sPath : oEvent.getSource()
				.oParent.oBindingContexts.RequestorInfo.sPath;
			var historicalRequestItem = this.modelAssignment("RequestorInfo").getProperty(sPath);
			if (historicalRequestItem.isPendingClose) {
				this.modelAssignment("oReadOnlyModel").setProperty("/isFieldEnabled", false);
				this.modelAssignment("oReadOnlyModel").setProperty("/isCloseCaseVisible", true);
				this.modelAssignment("oReadOnlyModel").setProperty("/isSaveSubmitVisible", false);
				isValidTask = this.loadTaskDetails(historicalRequestItem);
				Formatter.formatDataBeforeEdit(historicalRequestItem);
			} else {
				this.modelAssignment("oReadOnlyModel").setProperty("/isFieldEnabled", true);
				this.modelAssignment("oReadOnlyModel").setProperty("/isCloseCaseVisible", false);
				this.modelAssignment("oReadOnlyModel").setProperty("/isSaveSubmitVisible", true);
			}
			this.modelAssignment("oRequestData").setData(historicalRequestItem);
			if (isValidTask) {
				this.handleNav(oEvent);
			} else {
				
				 this.onProcessClosed(historicalRequestItem);
				 //MessageBox.error("Error Occurred while opening the Task")
			}

			// countComments = historicalRequestItem.clarificationCommentList.length;

			// console.log("countComments ::" + countComments);

		},

		loadTaskDetails: function (requestData) {
			var isValidTask = false;
			if (requestData.isClarificationReq) {
				var sServiceUrl = Config.dbOperations.fetchTaskDetail + requestData.requestId + "/Clarification Task";

			} else if (requestData.isPendingClose) {
				var sServiceUrl = Config.dbOperations.fetchTaskDetail + requestData.requestId + "/Resolve Confirm Task";
			}
			var taskData = this.fetchTaskDetail(sServiceUrl, this);
			// this.hideBusyIndicator();
			if (taskData.status === "S" && taskData.requestId === requestData.requestId) {
				isValidTask = true
				requestData.taskInstanceId = taskData.taskId;
				this.loadEntityList(requestData.sectorCode);
				this.modelAssignment("oRequestData").setData(requestData);
			}
			return isValidTask;
		},
		loadEntityList: function (vendorSector) {
			if (vendorSector) {
				var oEntityModel = this.modelAssignment("oEntityModel");
				oEntityModel.setProperty("/vendorSector", vendorSector);
				var entityList = this.loadBUList(vendorSector);
				var entityElement = {
					"code": "",
					"desc": ""
				};
				entityList.unshift(entityElement);
				oEntityModel.setProperty("/EntityList", entityList);
			}
		},
		onSelectIconFilter: function (oEvent) {
			var iconTabFilterKey = oEvent.getParameter("key");
			var prop;
			var aFilters = [];
			switch (iconTabFilterKey) {
			case "All":
				break;
			case "Completed":
				prop = new Filter("srStatusCode", sap.ui.model.FilterOperator.Contains, "7");
				aFilters.push(prop);
				break;
			case "Draft":
				prop = new Filter("srStatusCode", sap.ui.model.FilterOperator.Contains, "1");
				aFilters.push(prop);
				break;
			default:
				prop = new Filter("srStatusDesp", sap.ui.model.FilterOperator.Contains, "Pending");
				aFilters.push(prop);
				break;
			}
			// update list binding
			var list = this.getView().byId(iconTabFilterKey);
			var binding = list.getBinding("items");
			binding.filter(aFilters, "Application");

			// var iconTabFilterKey = oEvent.getParameter("key");

			// if( iconTabFilterKey == "Draft")
			// {
			// 	this.getAllUserRequestsNDetails("Draft",8,true);
			// }

			// else if(iconTabFilterKey == "InProcess")
			// {

			// 	this.getAllUserRequestsNDetails("InProcess",5,false);
			// }

			//  	else if(iconTabFilterKey == "Completed")
			// {

			// 	this.getAllUserRequestsNDetails("Completed",7,false);
			// }

		},

		handleOpen: function (oEvent) {

			// <Button press="onPressSubmit" icon= "sap-icon://visits"  text="Clarification Required" type="Reject" visible="true"/>
			// 					<Button press="onPressForward" icon= "sap-icon://forward" text="Forward" type="Emphasized" visible="true"/>
			// 					<Button icon="sap-icon://save" press="onPressSaveNotificationRequest" text="Save" type="Default"/>
			// 					<Button press="onPressConfirm" icon= "sap-icon://create" text="Confirm" type="Neutral" visible="true"/>

			var oSource = oEvent.getSource();
			var oActionSheet = new ActionSheet({
				title: "Open Products",
				placement: "Right",
				buttons: [new Button({
						icon: "sap-icon://visits",
						text: "Clarification Required",
						type: "Reject",
						press: function () {
							MessageToast.show("Selected action is");
						}
					}),
					new Button({
						icon: "sap-icon://forward",
						text: "Forward",
						type: "Default"
					}),
					new Button({
						icon: "sap-icon://save",
						text: "Save",
						type: "Emphasized"
					}),

					new Button({
						icon: "sap-icon://create",
						text: "Confirm",
						type: "Emphasized"
					})
				]
			});
			oActionSheet.openBy(oSource);
		},

		actionSelected: function () {
			MessageToast.show("Selected action is");
		},

		mandatoryCheck: function () {

			message = [];

			if (textSerReqCat == "") {
				// isMandatory = false;
				message.push("Please enter a valid Service Request Category!");
				this.getView().byId("oCaseCategoryList").setValueState("Error");
			}

			var serviceDet = this.getView().byId("caseSummaryId").getValue();
			if (serviceDet == "") {
				message.push("Please enter a valid Service Request Description!");
				this.getView().byId("caseSummaryId").setValueState("Error");

			}

			var vendorName = this.getView().byId("vendorNameId").getValue();
			if (vendorName == "")

			{
				message.push("Please enter Vendor Name in full");
				this.getView().byId("vendorNameId").setValueState("Error");

			}

			var staffAssigned = this.getView().byId("assignedToId").getValue();
			if (staffAssigned == "")

			{
				message.push("Please enter a valid Staff Assigned!");
				this.getView().byId("assignedToId").setValueState("Error");

			}

			//textEntity

			if (textEntity == "") {
				// isMandatory = false;
				message.push("Please enter a valid Entity!");
				this.getView().byId("oEntityNameList").setValueState("Error");
			}

		},

		onEntityNameSelect: function (oEvent) {
			var textEntity = oEvent.getSource().getSelectedItem().getText();
			this.modelAssignment("oRequestData").setProperty("/entityName", textEntity);
			// if (textEntity != "") {
			// 	this.getView().byId("oEntityNameList").setValueState("None");
			// } else {
			// 	this.getView().byId("oEntityNameList").setValueState("Error");
			// }
		},

		onListSelect: function (oEvent) {

			var selectedItem = oEvent.getSource().getSelectedItem().getKey();
			textSerReqCat = oEvent.getSource().getSelectedItem().getText();

			this.modelAssignment("oRequestData").setProperty("/srCategoryDesp", textSerReqCat);
			this.modelAssignment("oRequestData").setProperty("/urgentRequest", false);
			var checkBox = this.getView().byId("urgentReq");
			checkBox.setSelected(false);
			if (textSerReqCat != "") {

				this.getView().byId("oCaseCategoryList").setValueState("None");

			} else {
				this.getView().byId("oCaseCategoryList").setValueState("Error");
			}

			// var uiControl1 = this.getUIControl("invoiceNoLbl");
			// var uiControl2 = this.getUIControl("invoiceNoId");

			// if (selectedItem == "PayPO" || selectedItem == "InvRel" || selectedItem == "Contra") {

			// 	//sap.ui.getCore().byId("invoiceNoLbl").setVisible("false");

			// 	this.modelAssignment("oReadOnlyModel").setProperty("/isInvoiceVisible", true);

			// } else {
			// 	this.modelAssignment("oReadOnlyModel").setProperty("/isInvoiceVisible", false);
			// 	// uiControl1.setVisible(false);
			// 	// uiControl2.setVisible(false);

			// }

		},
		// Old Running ones!!
		// getAllUserRequestsNDetails: function (draftVarriable,colorSch,isVisible) {
		// 	// this.loadBusyIndicator("searchPage", true);
		// 	var draftVarriableL = draftVarriable;
		// 	var colorSchL = colorSch;
		// 	var isVisibleL = isVisible;
		// 	var requestorModel = this.modelAssignment("RequestorInfo");
		// 	var that = this;
		// 	// that.getUserDetails(requestorModel);
		// 	Service.retrieveUserRequests(function (requestData) {

		// 		requestData.requestList[0].statusText = draftVarriableL;
		// 		requestData.requestList[0].statusColorScheme = colorSchL;
		// 		requestData.requestList[0].isDeleteVisible = isVisibleL;
		// 		requestorModel.setData(requestData);

		// 		if (that.isInitial) {
		// 			that.getUserDetails(requestorModel);
		// 		}
		// 		// that.loadBusyIndicator("searchPage", false);
		// 	});
		// },

		/**
		 * Get All User Requests and Details
		 */
		getAllUserRequestsNDetails: function (isSave) {
			this.loadBusyIndicator("searchPage", true);
			var requestorModel = this.modelAssignment("RequestorInfo");
			requestorModel.refresh();
			var that = this;
			this.retrieveUserRequests(function (requestData) {
				requestorModel.setData(requestData);
				if (isSave) {
					var historicalRequest = that.modelAssignment("RequestorInfo").getData().requestList;
					var requestItemData = that.modelAssignment("oRequestData").getData();
					if (historicalRequest && historicalRequest instanceof Array && historicalRequest.length > 0) {
						for (var i = 0; i < historicalRequest.length; i++) {
							if (historicalRequest[i].draftId === requestItemData.draftId) {
								requestItemData.clarificationCommentList = historicalRequest[i].clarificationCommentList;
							}
						}
					}
					that.modelAssignment("oRequestData").setData(requestItemData);
				}
				that.loadBusyIndicator("searchPage", false);
			});
		},
		retrieveUserRequests: function (callBack) {
			var retrieveModel = new JSONModel();
			var sServiceUrl = Config.dbOperations.serviceRequestsUrl+ "?r=" + Formatter.getRandomNo(); //+ loggedInUser;
			
			var response;
			var oHeader = {
				"Content-Type": "application/json; charset=utf-8"
			};
			retrieveModel.loadData(this.getModulePath()+sServiceUrl, null, true, "GET", false, false, oHeader);
		
			//Success call Back
			retrieveModel.attachRequestCompleted(null, function (jsonData) {

				response = Formatter.formatUserRequests(jsonData.getSource().getData());
				callBack(response);

			});
		},
		/** 
		 * Refresh Button, reloads the historical requests from SAP PO
		 */
		onRefreshButtonPress: function () {
			this.getAllUserRequestsNDetails();
		},

		getUserDetails: function () {

			this.isInitial = false;
			this.modelAssignment("UserInfo", this.getLoggedInUser());
			//User Image Population
			// var imageData = this.retrieveUserImage(this.modelAssignment("UserInfo").getProperty("/logonId"));
			// var userInfoModel = this.modelAssignment("UserInfo");
			// userInfoModel.setProperty("/userImage", imageData);
		},
		/**
		 * On Press Service Request
		 */
		onPressCreateNewRequest: function () {

			this.modelAssignment("oRequestData").setData({});
			this.modelAssignment("oReadOnlyModel").setData({});
			this.handleControls();
			this.initializeLocalModel();
			this.handleNav("", "resolutionCreate");
			this.getView().byId("DP1").setMinDate(new Date());

		},

		onSelectRequest: function (oEvent) {
			var sPath = oEvent.getSource().oBindingContexts.RequestorInfo.sPath;
			var historicalRequestItem = this.modelAssignment("RequestorInfo").getProperty(sPath);
			this.modelAssignment("oRequestData").setData(historicalRequestItem);
			this.handleNav("", "resolutionDisplay");
		},

		displayServiceR: function () {

			this.modelAssignment("oRequestData").setData({});
			this.handleControls();
			this.handleNav("resolutionDisplay");
		},

		onPressServiceRating: function () {

			this.modelAssignment("oRequestData").setData({});
			this.handleControls();
			this.handleNav("ServiceRatingPage");
		},

		onPressApprovalPage: function () {

			this.modelAssignment("oRequestData").setData({});
			this.handleControls();
			this.handleNav("ApprovalPage");
		},

		onPressViewRequest: function () {

			this.modelAssignment("NotificationReq").setData({});
			this.handleControls();
			this.handleNav("resolutionDisplay");
		},
		/**
		 * Handle Controls
		 */
		handleControls: function (requestData) {
			var readOnly = this.modelAssignment("ReadOnlyModel");
			// readOnly.setData(Formatter.parseObjectData(this.getOwnerComponent().getModel().getProperty("/uiControls")));
		},
		/**
		 * Handle Navigation in Billing Request
		 */
		handleNav: function (oEvent, target) {
			var navContainer = this.getView().byId("notificationNav");
			if (!target) {
				target = oEvent.getSource().data("target");
			}
			navContainer.to(this.getView().byId(target), "slide");
		},

		/**
		 * Model Assignment Function
		 */
		modelAssignment: function (modelName, objAssign) {
			var view = this.getView();
			var model = view.getModel(modelName);
			if (!model) {
				if (objAssign) {
					model = new JSONModel(objAssign);
				} else {
					model = new JSONModel();
				}
				view.setModel(model, modelName);
			}
			return model;
		},
		onPressBack: function () {
			
			isClarifcation = false;
			
			var that = this;
			var dialog = new sap.m.Dialog({
				title: "Cancel",
				type: "Message",
				content: new sap.m.Text({
					text: "Unsaved data will be lost."
				}),
				beginButton: new sap.m.Button({
					text: "OK",
					press: function () {
						that.getAllUserRequestsNDetails();
						that.handleNav("", "searchPage");
						that.modelAssignment("oRequestData").setData({});
						that.modelAssignment("oReadOnlyModel").setData({});
						that.initializeLocalModel();
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: "Cancel",
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();

		},
		onPressBackFromDisplay: function () {
			// that.getAllUserRequestsNDetails();
			this.handleNav("", "searchPage");
			this.modelAssignment("oRequestData").setData({});
		},
		deleteDraftRequest: function (oEvent) {
			var bundle = this.localizationBundle;
			var actionSource = oEvent.getSource().data("actionSource");
			var sPath = (actionSource === "DraftPage") ? oEvent.getSource().oParent.oParent.oBindingContexts.RequestorInfo.sPath : oEvent.getSource()
				.oParent.oBindingContexts.RequestorInfo.sPath;
			// var sPath = oEvent.getSource().oParent.oParent.oBindingContexts.RequestorInfo.sPath;
			var historicalRequestItem = this.modelAssignment("RequestorInfo").getProperty(sPath);
			that = this;
			var dialog = new sap.m.Dialog({
				title: "Delete Draft",
				type: "Message",
				content: new sap.m.Text({
					text: "Do you want to delete draft request"
				}),
				beginButton: new sap.m.Button({
					text: "OK",
					press: function () {
						that.deleteDraftRecord(historicalRequestItem.draftId);
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: "Cancel",
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();

		},

		/** 
		 * Delete Draft Record from SAP PO
		 * @param draftId
		 */
		deleteDraftRecord: function (draftId) {
			//this.showBusyIndicator();
			this.deleteDraftRequest(draftId);
			this.getAllUserRequestsNDetails();
			//this.hideBusyIndicator();
		},

		// onPressSubmit: function (oEvent) {

		// 	var data = this.modelAssignment("NotificationReq").getData();
		// 	   var response = this.validatePostData();
		// 	   if (response.isValid) {
		// 	this.confirmOnAction("Submit");
		// 	// } else {
		// 	// 	this.modelAssignment("BillingReq").setData(data);
		// 	// 	this.showMessagePopOver(response.messageList);
		// 	// }
		// },

		/**
		 * Save Service Request
		 */
		onPressSaveServiceRequest: function (oEvent, isAttachment) {

			var serReqModel = this.modelAssignment("oRequestData");
			var requestData = serReqModel.getData();
			requestData.actionType = "D";
			requestData.srStatusCode = "1";
			var that = this;
			// requestData.srStatusDesp = "Draft";
			// requestData.netDueDate = (requestData.netDueDate) ? new Date (requestData.netDueDate) : "";
			// requestData.netDueDate = (this.getView().byId("DP1").getValue()) ? new Date(this.getView().byId("DP1").getValue()) : "";
			
			// console.log("Test ::createdDate:: before Save::"+ requestData.createdDate);
		    var tempDate = (requestData.createdDate) ? requestData.createdDate : "";
						
			requestData.createdDate = Formatter.formatDateAsString((tempDate) ? tempDate : "");
			
			requestData.contactEmail = this.modelAssignment("UserInfo").getProperty("/emailId");
			// requestData.requestedForEMail = this.getView().byId("requestedForEmail").getValue();

			this.loadBusyIndicator("resolutionCreate", true);

			this.saveNSubmitServiceRequest(requestData, "Save", that, function (saveResponse) {
				serReqModel.setProperty("/draftId", (requestData.draftId) ? requestData.draftId : saveResponse.requestNumber);
				serReqModel.setProperty("/titleDisplay", "Service Request Draft " + saveResponse.requestNumber);
				that.loadBusyIndicator("resolutionCreate", false);

				// MessageToast.show(saveResponse.message);

				if (isAttachment) { //Call Back in case of Attachment Upload without Saving
					that.handleUploadPress();
				} else {
					MessageToast.show(saveResponse.message);
				}
				that.onAfterSaveCalled(requestData);

			});
			// this.onAfterSaveCalled(requestData);

		},
		/** 
		 * on After saving data in SAP PO
		 * @param draftId
		 */
		onAfterSaveCalled: function (requestData) {
			// requestData = formatter.formatStringToArray2(requestData);
			this.getAllUserRequestsNDetails(true);
			// requestData.netDueDate = (requestData.netDueDate)? Formatter.formatDateAString(requestData.netDueDate, "dd/MM/yyyy") : "";

		},

		/**
		 * On After Close Task
		 */
		onAfterCloseTask: function (postTaskData, response, requestData) {
			var postElement;
			var that = this;
			// requestData.createdDate = (requestData.createdDate) ? Formatter.formatDateAsString(requestData.createdDate, "yyyy-MM-dd") : "";
			var tempDate = (requestData.createdDate) ? requestData.createdDate : "";
			requestData.createdDate = Formatter.formatDateAsString((tempDate) ? tempDate : "");
			
			jQuery.sap.each(postTaskData.taskList, function (p) {
				postElement = postTaskData.taskList[p];
				if (response[postElement.taskId]) {
					Object.assign(postElement, response[postElement.taskId]);
					if (postElement.status === "S") {
						this.saveNSubmitServiceRequest(requestData, "", that, function (submitResponse) {
							// that.modelAssignment("BillingReq").setProperty("/requestId", submitResponse.requestNo);
							var message = "";
							 if(requestData.isClarificationReq)
							 {
							 	message = "submitted."
							 }
							 else if(isClarifcation)
							 {
							 	message = "re opened."
							 	
							 }
							 else
							 {
							 	message = "closed."
							 }
							 
							MessageBox.alert("Service Request "+requestData.requestId+" has been "+message, {
								icon: MessageBox.Icon.SUCCESS,
								title: "Success",
								onClose: function () {
									isClarifcation = false;
									that.handleNav("", "searchPage");
									that.getAllUserRequestsNDetails();
								}
							});
						});
					} else {
						// MessageBox.error("Error occurred while completing requester task");
						if(!requestData.isClarificationReq && !isClarifcation)
						{
						that.onProcessClosed(requestData);
						that.handleNav("", "searchPage");
						}
						else
						{
							MessageBox.error("Error occurred while completing requester task");
						}
					}
				}
			});
		},
		// onPressSubmit: function (oEvent) {
		// 	var billingReqModel = this.modelAssignment("BillingReq");
		// 	var data = billingReqModel.getData();
		// 	var response = Validation.validateBillingRequestData(data, this.localizationBundle);
		// 	if (response.isValid) {
		// 		if (!data.fixedRecurring) { //If the Billing Request is Normal
		// 			data.billingCutoffDate = this.getBillingCutOffDate();
		// 			data.billingDate = data.billingCutoffDate;
		// 		}
		// 		this.confirmOnAction("Submit");
		// 	} else {
		// 		billingReqModel.setData(data);
		// 		this.modelAssignment("BillingItemReq").setData(billingReqModel.getProperty("/itemsList/" + (this.currentItem)));
		// 		this.showMessagePopOver(response.messageList);
		// 	}
		// },	

		onPressSubmit: function (oEvent) {

			var actionSource = oEvent.getSource().data("actionSource");
			if (actionSource === "Reopen Case" || actionSource === "Close Case") {
				// Added By Samudra countComments >= countCommIncrease
				if (!isClarifcation && actionSource === "Reopen Case") {
					MessageBox.alert("Please enter comment under Clariifcation comment section before re opening the case", {
						icon: MessageBox.Icon.WARNING,
						title: "Re open Warning",
						onClose: function () {

						}
					});
				} else {
					this.closeMessageStrip();
					this.confirmOnAction(actionSource);
				}

			} else {
				if (this.validatePostData()) {
					// var requestData = this.modelAssignment("oRequestData").getData();
					this.closeMessageStrip();
					this.confirmOnAction("Submit");
				} else {
					this.openMessagePopover(this.modelAssignment("oMessageModel").getData());
				}
			}

			// var isSubmit = this.validatePostData(); 
			// var isSubmit = true;
			// if (isSubmit) {

			// 	// var requestData = this.modelAssignment("oRequestData").getData();
			// 	// this.closeMessageStrip();
			// 	this.confirmOnAction("Submit");
			// }

		},

		/** 
		 * Show error message after validation in Message Popover
		 * @param messageElementArray
		 */
		openMessagePopover: function (messageElementArray) {
			var messageElement = {},
				messageModelData = [];
			var messageModel = this.modelAssignment("MessagePopOver");
			$.each(messageElementArray, function (i) {
				messageElement = {};
				messageElement.title = messageElementArray[i];
				messageElement.message = messageElementArray[i];
				messageElement.type = sap.ui.core.MessageType.Error;
				messageModelData.push(messageElement);
			});
			messageModel.setData(messageModelData);
			var showButton = this.getView().byId("MsgalrtBtn");
			showButton.firePress();
		},

		validatePostData: function () {
			var isComplete = false;
			var emailFilter =
				/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			var message = [],
				status = 0;
			var requestData = this.modelAssignment("oRequestData").getData();
			// Setting Net Due Date , Contact Email & requestedForEmail explicitly
			requestData.netDueDate = (requestData.netDueDate) ? new Date(requestData.netDueDate) : "";
			// requestData.netDueDate = new Date(this.getView().byId("DP1").getValue());
			requestData.contactEmail = this.modelAssignment("UserInfo").getProperty("/emailId");
			requestData.requestedForEMail = this.modelAssignment("oRequestData").getProperty("/requestedForEMail");

			if (!requestData.srCategoryDesp) {
				message.push("Please select Service Category");
				status++;
			} else if (requestData.srCategoryCode === "PayPO" || requestData.srCategoryCode === "InvRel" ||
				requestData.srCategoryCode === "Contra") {
				if (!requestData.invoiceNo1) {
					message.push("Please enter alteast one Invoice Value");
					status++;
				}
			}
			if (requestData.requestedForEMail) {
				if (!emailFilter.test(requestData.requestedForEMail)) {
					message.push("Please enter a valid requested for Email");
					status++;
				}
			}
			if (!requestData.srDetails) {
				message.push("Please enter Service Details");
				status++;
			}
			// if (!requestData.sectorCode) {
			// 	message.push("Please select Sector for Request");
			// 	status++;
			// }
			if (!requestData.entityCode) {
				message.push("Please select Entity for Request");
				status++;
			}
			if (!requestData.vendorName) {
				message.push("Please enter Vendor Name in full");
				status++;
			}
			this.modelAssignment("oMessageModel").setData(message);
			if (status > 0) {
				isComplete = false;
			} else {
				isComplete = true;
			}
			return isComplete;

		},
		/**
		 * Confirmation Dialog before performing any task level operation
		 */
		confirmOnAction: function (actionType, request, actionCode) {
			var that = this;
			var isReject = (actionType === "Reject" || actionType === "Reject Multiple Tasks");
			var dialog = new Dialog({
				title: (actionType === "Forward") ? "Assign User" : (isReject) ? "Comments" : "Confirmation",
				type: "Message",
				content: new sap.m.Text({

					text: "Do you want to " + ((actionType === "Claim") ? "Reserve" : actionType) + "?",
					visible: (!isReject && actionType !== "Forward")
				}),
				beginButton: new sap.m.Button({

					text: (isReject) ? "Proceed" : "Yes",
					icon: (isReject) ? "sap-icon://begin" : "sap-icon://action",
					press: function () {
						dialog.close();
						that.handleSubmit(false, actionType); //  To Trigger the PTP Process.
					}
				}),
				endButton: new sap.m.Button({
					text: (isReject) ? "Cancel" : "No",
					icon: "sap-icon://decline",
					press: function () {
						dialog.close();
						// countComments = 0;
						// countCommIncrease = 0;
						isClarifcation = false;
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});

			dialog.open();
		},


		handleSubmit: function (isUpload, actionType) {
			var requestData = this.modelAssignment("oRequestData").getData();
			requestData.actionType = "S";
			requestData.srStatusCode = (requestData.isPendingClose && actionType === "Close Case") ? "7" : "2";
			if(requestData.srStatusCode==="2")
			{
			requestData.srStatusDesp = "Pending Resolution";
			}
			else
			{
				requestData.srStatusDesp = "Closed";
			}
			var that = this;
			// requestData.netDueDate = (requestData.netDueDate) ? new Date(requestData.netDueDate) : "";
			console.log("Test ::createdDate:: before submit ::"+ requestData.createdDate);
		    var tempDate = (requestData.createdDate) ? requestData.createdDate : "";
			requestData.createdDate = Formatter.formatDateAsString((tempDate) ? tempDate : "");
			
			// requestData.createdDate = (requestData.createdDate) ? Formatter.formatDateAsString(requestData.createdDate, "yyyy-MM-dd") : "";
			  
			if (requestData.isClarificationReq || requestData.isPendingClose) {
				requestData.taskCreated = (requestData.isClarificationReq || requestData.isPendingClose);
				if (requestData.taskInstanceId) {
					var taskData = Formatter.formatPostData(requestData, requestData.taskInstanceId, actionType);
					this.closeTask(taskData, function (response) {
						that.onAfterCloseTask(taskData, response, requestData);
					});
				} else {
					 MessageBox.error("Error occurred while submitting the request");
					  //this.onProcessClosed(requestData);
					
				}
			} else {
				this.saveNSubmitServiceRequest(requestData, "", that, function (submitResponse) {
					// that.modelAssignment("BillingReq").setProperty("/requestId", submitResponse.requestNo);
					MessageBox.alert(submitResponse.message, {
						icon: MessageBox.Icon.SUCCESS,
						title: "Success",
						onClose: function () {
							if (!isUpload) {
								that.handleNav("", "searchPage");
							} else {
								that.handleUploadPress();
							}
							that.getAllUserRequestsNDetails();
						}
					});
				});
			}
		},

		handleSubmit1: function () {

			var requestData = this.modelAssignment("BillingReq").getData();
			requestData.actionType = "S";
			this.loadBusyIndicator("billingRequest", true);
			var that = this;
			this.saveNSubmitServiceRequest(requestData, "", this, function (submitResponse) {
				that.modelAssignment("BillingReq").setProperty("/requestId", submitResponse.requestNo);
				MessageBox.alert(submitResponse.message, {
					icon: MessageBox.Icon.SUCCESS,
					title: "Success",
					onClose: function () {
						// that.handleNav("searchPage");
						// that.loadBusyIndicator("billingRequest", false);
						// that.getAllUserRequestsNDetails();
					}
				});
			});
		},

		/**
		 * Item selection Value Help
		 */
		itemValueHelp: function (oEvent) {
			var src = oEvent.getSource();
			var urlPath = src.getUrlAttr();
			// var itemsPath = oEvent.getSource().getBindingContext("BillingReq").getPath();
			var companyCode = this.modelAssignment("NotificationReq").getProperty("/companyCode");
			if (companyCode) {
				var notificationReq = this.modelAssignment("NotificationReq");
				var sourceType = src.getProperty("name");
				var sServiceUrl = Config.gwTaskOperations.baseBillingUrl + urlPath;
				sServiceUrl += (sourceType === "JobNo" || sourceType ===
					"WBSElement") ? "?$filter=CompCode eq " : "?CompCode=";
				sServiceUrl += "'" + companyCode + "'";
				if ((sourceType === "JobNo")) {
					sServiceUrl += " and OrderNumber eq '000008010034'";
				}
				src.setUrlPath(sServiceUrl);
				src.openValueHelp(oEvent, null, false, null, "GL", function (selectedObj) {
					if (sourceType === "JobNo") {
						notificationReq.setProperty("/jobNoDesc", selectedObj.OrderDesc);
						notificationReq.setProperty("/jobNoVState", ValueState.None);
					} else if (sourceType === "WBSElement") {
						notificationReq.setProperty("/wbsElementDesc", selectedObj.Post1);
						notificationReq.setProperty("/wbsElementVState", ValueState.None);
					}
				});
			}
		},
		/**
		 * Company Code Value Help
		 */
		companyValueHelp: function (oEvent) {
			var src = oEvent.getSource();
			var sServiceUrl = Config.dbOperations.loadUserConfigUrl;
			src.setUrlPath(sServiceUrl);
			// src.openValueHelp(oEvent, null, true);
			var notificationReqModel = this.modelAssignment("NotificationReq");
			src.openValueHelp(oEvent, null, false, null, "Company", function (selectedObj) {
				notificationReqModel.setProperty("/companyCode", selectedObj.companyCode);
				notificationReqModel.setProperty("/entityName", selectedObj.companyName);
				notificationReqModel.setProperty("/systemClient", selectedObj.systemClient);
				notificationReqModel.setProperty("/supportStaff", selectedObj.supportStaff);
				notificationReqModel.setProperty("/sector", selectedObj.sector);
			});
		},
		/**
		 * On Press Edit Service Request
		 */
		onPressEditRequest: function (oEvent) {

			var bindingContext = oEvent.getSource().getParent().getBindingContext("RequestorInfo");
			var selectedCtx = bindingContext.oModel.getProperty(bindingContext.getPath());
			var billingReqModel = this.modelAssignment("ServiceReq");
			billingReqModel.setData(selectedCtx);
			this.handleNav("resolutionCreate");
			this.getView().byId("DP1").setMinDate(new Date());
			// var that = this;
			//Retrieve Billing Request Data
			// Service.retrieveBillingRequest(selectedCtx.draftId, function (billingResponse) {
			// 	billingReqModel.setData(Formatter.formatBillingRequestData(billingResponse));
			// 	that.handleControls(billingReqModel.getData());
			// 	that.handleNav("billingRequest");
			// });
		},
		/** 
		 * Cancel request, opens Confirmation dialog box.
		 * @param oEvent
		 */
		onPressCancelRequest: function (oEvent) {
			var sPath = oEvent.getSource().getParent().oBindingContexts.RequestorInfo.sPath;
			var historicalRequestItem = this.modelAssignment("RequestorInfo").getProperty(sPath);
			// var bundle = this.localizationBundle;
			var that = this;
			var dialog = new sap.m.Dialog({
				title: "Cancel Request",
				type: "Message",
				content: new sap.m.Text({
					text: "Do you want to cancel request?"
				}),
				beginButton: new sap.m.Button({
					text: "OK",
					press: function () {
						that.handleProcessCancellation(historicalRequestItem);
						dialog.close();

						//MessageToast.show("Cancel Request has been raised for " + historicalRequestItem.requestId);
					}
				}),
				endButton: new sap.m.Button({
					text: "Cancel",
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},
		/** 
		 * Cancel Process in PO
		 * @param historicalRequestItem, 
		 */
		handleProcessCancellation: function (historicalRequestItem) {
			if (historicalRequestItem.requestId) {
				// var sServiceUrl = config.poUrl + config.javaOperations.cancelProcess + historicalRequestItem.requestId;
				var sServiceUrl = Config.dbOperations.cancelProcess;
				var taskData = Formatter.formatPostDataForCancel(historicalRequestItem);
				this.loadBusyIndicator("searchPage", true);
				this.cancelProcessinPO(sServiceUrl, this, historicalRequestItem, taskData);
				this.loadBusyIndicator("searchPage", false);
			} else {
				MessageToast.show("System Error occurred while Cancelling Process");
			}
		},
		/** 
		 * After Process Cancellation in PO, set the record status to Cancellation
		 * @param historicalRequestItem
		 */
		onAfterProcessCancellation: function (historicalRequestItem) {
			historicalRequestItem.srStatusCode = '9';
			historicalRequestItem.actionType = "S";
			this.loadBusyIndicator("searchPage", true);
			var that = this;
			// var sServiceUrl = Config.dbOperations.cancelRequest + historicalRequestItem.requestId;
			this.saveNSubmitServiceRequest(historicalRequestItem, "", that, function (submitResponse) {
				// that.modelAssignment("BillingReq").setProperty("/requestId", submitResponse.requestNo);
				MessageBox.alert("Service Request "+historicalRequestItem.requestId+ " has been cancelled. ", {
					icon: MessageBox.Icon.SUCCESS,
					title: "Success",
					onClose: function () {
						//that.handleNav("", "searchPage");
						that.getAllUserRequestsNDetails();
					}
				});
			});
			this.loadBusyIndicator("searchPage", false);
		},
		// Added by Samudra for standalone change the status.Pending close to close
		onProcessClosed: function (historicalRequestItem) {
			
			historicalRequestItem.srStatusCode = '7';
			historicalRequestItem.srStatusDesp = 'Closed';
			historicalRequestItem.actionType = "S";
			
			this.loadBusyIndicator("searchPage", true);
			var that = this;
			// var sServiceUrl = Config.dbOperations.cancelRequest + historicalRequestItem.requestId;
			this.saveNSubmitServiceRequest(historicalRequestItem, "", that, function (submitResponse) {
				// that.modelAssignment("BillingReq").setProperty("/requestId", submitResponse.requestNo);
				MessageBox.alert("Service Request "+historicalRequestItem.requestId+ " has been closed. ", {
					icon: MessageBox.Icon.SUCCESS,
					title: "Success",
					onClose: function () {
						//that.handleNav("", "searchPage");
						that.getAllUserRequestsNDetails();
					}
				});
			});
			this.loadBusyIndicator("searchPage", false);
		},
		
		/**
		 * On Press Delete Service Request
		 */
		onPressDeleteRequest: function (oEvent) {
			// console.log(oEvent);
			var sPath = oEvent.getSource().getBindingContext("RequestorInfo").sPath;
			var draftId = this.modelAssignment("RequestorInfo").getProperty(sPath).draftId;
			this.deleteDraftRequest(draftId);
			var idx = sPath.substring(sPath.lastIndexOf("/") + 1, sPath.length);
			var itemList = this.modelAssignment("RequestorInfo").getProperty("/requestList");
			itemList.splice(Number(idx), 1);
			this.modelAssignment("RequestorInfo").setProperty("/itemsList", itemList);
		},

		/**
		 * On Post Feed Comment
		 */
		onPostComment: function (oEvent) {

			// countCommIncrease = countComments + 1;
            isClarifcation = true;
			var oRequestDataModel = this.modelAssignment("oRequestData");
			var commentData = oRequestDataModel.getProperty("/clarificationCommentList");
			// create new entry
			var sValue = oEvent.getParameter("value");
			var loggedInDetails = this.modelAssignment("UserInfo").getData();
			sValue = sValue.trim();
			var sDate = Formatter.formatDateAsString(null, "yyyy-MM-dd hh:MM");
			var displayDate = Formatter.formatDateAsString(sDate, "dd/MM/yyyy hh:MM");
			var oEntry = {
				"userId": loggedInDetails.loginId,
				"userName": loggedInDetails.fullName,
				"comments": sValue,
				"commentDate": sDate,
				"commentDisplayDate": displayDate,
				"userType": "Requestor",
				"commentType": "CLARIFICATION"
			};

			commentData = (commentData instanceof Array) ? commentData : [];
			commentData.unshift(oEntry);
			oRequestDataModel.setProperty("/clarificationCommentList", commentData);

		},
		/** 
		 * Service call to SAP PO to delete attachment
		 * @param draftId
		 */
		onPressDeleteAttachment: function (oEvent) {
			// var bundle = this.localizationBundle;
			var sPath = oEvent.getSource().getParent().oBindingContexts.oRequestData.sPath;
			var oAttachmentModelData = this.modelAssignment("oRequestData").getProperty(sPath);
			that = this;
			var dialog = new sap.m.Dialog({
				title: "Delete Attachments",
				type: "Message",
				content: new sap.m.Text({
					text: "Do you want to delete attachment?"
				}),
				beginButton: new sap.m.Button({
					text: "OK",
					press: function () {
						that.deleteAttachmentRecord(oAttachmentModelData, sPath);
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: "Cancel",
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();

		},

		/** 
		 * on press delete attachment
		 * @param attachmentData
		 * @param sPath
		 */
		deleteAttachmentRecord: function (attachmentData, sPath) {
			var path = attachmentData.path.replace("/attachments/", "");
			var sServiceUrl = Config.dbOperations.deleteAttachment + path + encodeURIComponent(attachmentData.fileName) + "/" +
				attachmentData.serialId;
			// this.showBusyIndicator();
			sPath = sPath.replace('/attachmentList/', '');
			this.deleteAttachment(sServiceUrl, this, sPath);
			// this.hideBusyIndicator();

		},

		onPressAttachmentDownload: function (oEvent) {
			var sPath = oEvent.getSource().getParent().oBindingContexts.oRequestData.sPath;
			var oAttachmentModelData = this.modelAssignment("oRequestData").getProperty(sPath);
			this.downloadAttachment(oAttachmentModelData);
		},
		downloadAttachment: function (selectedAttachment) {
			selectedAttachment.fileName = (selectedAttachment.isArchived) ? selectedAttachment.requestNo : selectedAttachment.fileName;
			var http;
			if (window.XMLHttpRequest) {
				// code for IE7+, Firefox, Chrome, Opera, Safari
				http = new XMLHttpRequest();
			} else {
				// code for IE6, IE5
				http = new ActiveXObject("Microsoft.XMLHTTP");
			}
			http.open("GET", "/poutil/rest/File/download/" + selectedAttachment.projectType + "/" + selectedAttachment.requestNo + "/" +
				selectedAttachment.fileName, true);
			http.responseType = "blob";
			http.onload = function () { //Call a function when the state changes.
				if (this.status === 200) {
					var blob = this.response;
					if (typeof window.navigator.msSaveBlob !== "undefined") {
						// IE workaround
						window.navigator.msSaveBlob(blob, documentName);
					} else {
						var URL = window.URL || window.webkitURL;
						var downloadUrl = URL.createObjectURL(blob);
						// use HTML5 a[download] attribute to specify filename
						var a = document.createElement("a");
						// safari doesn't support this yet
						if (typeof a.download === "undefined") {
							window.location = downloadUrl;
						} else {
							a.href = downloadUrl;
							a.download = selectedAttachment.fileName;
							// a.style.display = "none";
							document.body.appendChild(a);
							a.click();
						}

						setTimeout(function () {
							URL.revokeObjectURL(downloadUrl);
						}, 100); // cleanup
					}
				}
			};
			http.send();
		},
		assignAttachmentData: function (response) {
			var oRequestDataModel = this.modelAssignment("oRequestData");
			var attachments = oRequestDataModel.getProperty("/attachmentList");
			attachments = (attachments instanceof Array) ? attachments : [];
			attachments.push(JSON.parse(response));
			oRequestDataModel.setProperty("/attachmentList", attachments);
		},
		handleUploadPress: function () {
			var formData = new FormData();
			var requestData = this.modelAssignment("oRequestData").getData();
			var darftId = requestData.draftId;
			var fU = this.getUIControl("fileUploader");
			if (requestData.docType) {
				if (fU.getProperty("value")) {
					if (darftId) {
						var requestObject = {
							"fileName": fU.getProperty("value"),
							"requestNo": darftId,
							"projectType": "PTP",
							"mimeType": fU.getProperty("value").split(".")[1],
							"documentType": requestData.docType,
							"userType": "Requester"
						};
						formData.append("request", JSON.stringify(requestObject));
						var domRef = fU.getFocusDomRef();
						var file = domRef.files[0];
						var base64marker = "data:" + file.type + ";base64,";
						var reader = new FileReader();

						// Create a File Reader object
						var that = this;

						reader.onload = function (evt) {
							var base64Index = evt.target.result.indexOf(base64marker) + base64marker.length;
							var base64 = evt.target.result.substring(base64Index);

							// var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
							//var base64 = dataURI.substring(base64Index);
							var raw = window.atob(base64);
							var rawLength = raw.length;
							var array = new Uint8Array(new ArrayBuffer(rawLength));

							for (var i = 0; i < rawLength; i++) {
								array[i] = raw.charCodeAt(i);
							}
							//return array;

							formData.append("file", file);

							/*Append your file details*/
							var settings = {
								"async": true,
								"crossDomain": true,
								"url": "/poutil/rest/File/upload",
								"method": "POST",
								"processData": false,
								"contentType": false,
								"mimeType": "multipart/form-data",
								"data": formData
							};
							jQuery.ajax(settings).done(function (response) {
								// jQuery.sap.log.info(response);
								that.assignAttachmentData(response);
								// console.log(response);
							}).fail(function (error) {
								// console.log(error);
							});
						};
						//Read File
						reader.readAsDataURL(file);
					} else {
						this.onPressSaveServiceRequest("", true)
					}
				} else {
					MessageBox.error("Please select a file to upload");
				}
			} else {
				MessageBox.error("Please select a valid Document Type");
			}
		},
		checkNumber: function (oEvent) {
			var value = oEvent.getSource().getValue();
			var bNotnumber = isNaN(value);
			if (bNotnumber == false) {
				this.sNumber = value;
			}
			oEvent.getSource().setValue(this.sNumber);
		},
		/**
		 * Fetch control
		 */
		getUIControl: function (id, fragmentId) {
			var view = this.getView();
			var control = (fragmentId) ? Fragment.byId(fragmentId, id) : (view.byId(id)) ? view.byId(id) : sap.ui.getCore().byId(id);
			return control;
		}
	});
});
var that;
// var isMandatory = false;
var message = [];
var textSerReqCat = "";
var textEntity = "";
var isClarifcation = false;
 //var countComments = 0;
 //var countCommIncrease = 0;