sap.ui.define(['sap/ui/model/json/JSONModel', '../util/configuration', '../util/dataformatter', 'sap/m/MessageBox',
		'sap/m/MessageToast'
	],
	function (JSONModel, Config, Formatter, MessageBox, MessageToast) {

		var services = ("com.stengg.btp.ptpui.model.services", {
			/**
			 * Retrieve Service Requests
			 */
			retrieveUserRequests: function (callBack) {
				var retrieveModel = new JSONModel();
				var sServiceUrl = Config.dbOperations.serviceRequestsUrl+ "?r=" + Formatter.getRandomNo(); //+ loggedInUser;
				
				var response;
				var oHeader = {
					"Content-Type": "application/json; charset=utf-8"
				};
				retrieveModel.loadData(this.getModulePath() + sServiceUrl, null, true, "GET", false, false, oHeader);
			
				//Success call Back
				retrieveModel.attachRequestCompleted(null, function (jsonData) {

					response = Formatter.formatUserRequests(jsonData.getSource().getData());
					callBack(response);

				});
			},
			getModulePath: function () {
				var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
				var appPath = appId.replaceAll(".", "/");
				var appModulePath = jQuery.sap.getModulePath(appPath);
				return appModulePath;
			},
			/***
			 * Retrieve User Image from Successfactors
			 */
			retrieveUserImage: function (userName) {
				var imageData;
				var sServiceUrl;
				var imageModel = new sap.ui.model.json.JSONModel();
				sServiceUrl = Config.sfOperations.gwSFUrl + "userId='" + userName + "')";
				imageModel = new sap.ui.model.json.JSONModel();
				imageModel.loadData(sServiceUrl, null, false);
				imageData = imageModel.getData();
				if (imageData.d && imageData.d.Status === "S") {
					imageData = "data:" + imageData.d.Mimetype + ";base64," + imageData.d.Photoimg;
					// imageData = "data:image/jpeg;base64," + imageData.d.photo;
				} else {
					imageData = "";
				}
				return imageData;
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
				taskDetailModel.loadData(sServiceUrl, null, false);
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
				var sServiceUrl = Config.dbOperations.loadLookupData + vendorSector;
				buModel.loadData(sServiceUrl, null, false);
				return buModel.getData();
			},
			saveNSubmitServiceRequest: function (requestData,actionType, caller,callBack) {

				var response;
				var sServiceUrl = (requestData.isClarificationReq || requestData.isPendingClose || requestData.cancelVisible) ? Config.dbOperations.saveNSubmitPTPRequestUrl : Config.dbOperations.saveNSubmitRequestUrl;
				var serviceReqModel = new JSONModel();
				var oHeader = {
					"Content-Type": "application/json; charset=utf-8"
				};
				serviceReqModel.loadData(sServiceUrl, JSON.stringify(requestData), true, "POST", false, false, oHeader);
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
				deleteModel.loadData(sServiceUrl, null, false);
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
				oModel.loadData(sServiceUrl, null, false);
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
				cancelModel.loadData(sServiceUrl, JSON.stringify(taskData), true, "POST", false, false, oHeader);
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

				taskModel.loadData(sServiceUrl, JSON.stringify({
					"taskCompletionDto": taskData.taskList
				}), true, "POST", false, false, oHeader);
				//Success call Back
				taskModel.attachRequestCompleted(null, function (jsonData) {
					callBack(taskModel.getData());
				});
			}
		});
		return services;
	});