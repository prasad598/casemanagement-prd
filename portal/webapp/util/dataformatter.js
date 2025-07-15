sap.ui.define([],
	function () {
		var dataformatter = ("com.stengg.btp.ptpui.utils.dataformatter", {
			isWebIDE: (window.location.host.indexOf("webide") > -1),
			/**
			 * Format Billing User Requests Data
			 */
			formatUserRequests: function (dataSet, userInfo) {
				var data = {
					"requestList": [],
					"draftCount": 0,
					"inProgressCount": 0,
					"invoiceCount": 0,
					"completeCount": 0
				};
				var dataSetMap = (dataSet.responseMap) ? dataSet.responseMap : "";
				if (dataSetMap && dataSetMap.RequestList && dataSetMap.RequestList instanceof Array) {
					data.count = dataSetMap.RequestList.length;
					var element;
					var tempDate;
					var netDueDate;
					var that = this;
					jQuery.sap.each(dataSetMap.RequestList, function (t) {
						element = dataSetMap.RequestList[t];
						tempDate = (element.createdDate) ? element.createdDate : "";
						netDueDate = (element.netDueDate) ? element.netDueDate : "";
						element.sortCreationDate = that.formatDateAsString((tempDate) ? tempDate : "NA");
						element.dueDateDisplay = that.formatDateAsString((netDueDate) ? netDueDate : "NA", "dd/MM/yyyy");
						// element.submissionDateDisplay = that.formatDateAsString((tempDate) ? tempDate : "NA", "dd/MM/yyyy hh:MM:ss");
						element.submissionDateDisplay = that.formatDateAsString((tempDate) ? tempDate : "NA", "dd/MM/yyyy hh:MM");
						element.draftDisplay = (!element.requestId) ? "Draft - " + element.draftId : element.requestId;
						element.statusColorScheme = (element.srStatusCode === "1") ? 9 : (element.srStatusCode === "2") ? 7 : (element.srStatusCode ===
							"3") ? 6 : (element.srStatusCode === "4") ? 5 : (element.srStatusCode === "5") ? 4 : (element.srStatusCode === "6") ? 6 : (
							element.srStatusCode === "7") ? 8 : (element.srStatusCode === "9") ? 3 : 1;
						element.srStatusDesp = (element.srStatusCode === "1") ? "Draft" : (element.srStatusCode === "2") ? "Pending Resolution Team" : (
								element.srStatusCode === "3") ? "Pending Resolution Lead" : (element.srStatusCode === "4") ? "Clarification Required" : (element.srStatusCode ===
								"5") ? "Pending Confirmation" : (element.srStatusCode === "6") ? "Pending Close" : (element.srStatusCode === "7") ?
							"Closed" : (element.srStatusCode === "9") ? "Cancelled" : "";
						element.isDeleteVisible = (element.srStatusCode === "1");
						element.isClarificationReq = (element.srStatusCode === "4");
						element.cancelVisible = (element.srStatusCode !== "1" && element.srStatusCode !== "9" && element.srStatusCode !== "7" && element.srStatusCode !== "6");
						element.isPendingClose = (element.srStatusCode === "6");
						element.priorityDesc = (element.urgentRequest) ? "Urgent" : "";
						// element.netDueDate = (element.netDueDate) ? that.formatDateAsString(element.netDueDate, "dd/MM/yyyy") : "";
						data.draftCount += (element.srStatusCode === "1") ? 1 : 0;
						data.inProgressCount += (element.srStatusCode === "2" || (element.srStatusCode === "3") || (element.srStatusCode === "4") || (
							element.srStatusCode === "5") || (element.srStatusCode === "6")) ? 1 : 0;
						data.completeCount += (element.srStatusCode === "7") ? 1 : 0;
					
					if (element.clarificationCommentList instanceof Array) {
					jQuery.sap.each(element.clarificationCommentList, function (c) {
						element.clarificationCommentList[c].commentDisplayDate = that.formatDateAsString(element.clarificationCommentList[c].commentDate,
							"dd/MM/yyyy hh:MM");
					});
				}
				
				// var createdADate = (attachmentList[i].createdDate) ? requestData.attachmentList[i].createdDate : "";
						//  console.log("attachment date ptp create::"+createdADate);
						// attachmentList[i].attachmentDateDisplay = that.formatDateAsString((createdADate) ? createdADate : "NA", "dd/MM/yyyy hh:MM");
				if (element.attachmentList instanceof Array) {
					jQuery.sap.each(element.attachmentList, function (c) {
						 var createdADate = (element.attachmentList[c].createdDate) ? element.attachmentList[c].createdDate : "";
						element.attachmentList[c].attachmentDateDisplay = that.formatDateAsString((createdADate) ? createdADate : "NA", "dd/MM/yyyy hh:MM");
					});
				}
				
                data.requestList.push(that.parseObjectData(element));
					});
				}
				return data;
			},
			formatDataBeforeEdit: function (requestData) {
				// var that = this;
				if (requestData.attachmentList && requestData.attachmentList instanceof Array && requestData.attachmentList.length > 0) {
					var attachmentList = requestData.attachmentList;
					$.each(attachmentList, function (i) {
						attachmentList[i].isFieldEnabled = false;
						// var createdADate = (attachmentList[i].createdDate) ? requestData.attachmentList[i].createdDate : "";
						//  console.log("attachment date ptp create::"+createdADate);
						// attachmentList[i].attachmentDateDisplay = that.formatDateAsString((createdADate) ? createdADate : "NA", "dd/MM/yyyy hh:MM");
					});
				}
			},
			/*
			 * Format Date as String
			 */
			formatDateAsString: function (dateValue, format, isYearFormat) {
				var response = "";
				if (dateValue !== "NA" && dateValue !== "/Date(0)/") {
					if (dateValue) {
						if (typeof (dateValue) === "string" && dateValue.indexOf("/Date") > -1) {
							dateValue = parseFloat(dateValue.substr(dateValue.lastIndexOf("(") + 1, dateValue.lastIndexOf(")") - 1));
						}
						dateValue = new Date(dateValue);
					} else {
						dateValue = new Date();
					}

					//Format Year
					var yyyy = dateValue.getFullYear() + "";
					var tempDateStr = new Date().getFullYear();
					if (isYearFormat && (parseInt(yyyy) < tempDateStr)) {
						yyyy = tempDateStr.toString().substring(0, 2) + yyyy.substring(2, yyyy.length);
					}
					var mm = (dateValue.getMonth() + 1) + "";
					mm = (mm.length > 1) ? mm : "0" + mm;
					var dd = dateValue.getDate() + "";
					dd = (dd.length > 1) ? dd : "0" + dd;

					var hh, mins, secs;

					switch (format) {
					case "yyyyMMdd":
						response = yyyy + mm + dd;
						break;
					case "dd/MM/yyyy":
						response = dd + "/" + mm + "/" + yyyy;
						break;
					case "yyyy-MM-dd":
						response = yyyy + "-" + mm + "-" + dd;
						break;
					case "yyyy-dd-MM":
						response = yyyy + "-" + dd + "-" + mm;
						break;
					case "MM/dd/yyyy":
						response = mm + "/" + dd + "/" + yyyy;
						break;
					case "MM/yyyy":
						response = mm + "/" + yyyy;
						break;
					case "yyyy-MM-ddThh:MM:ss":
						hh = dateValue.getHours() + "";
						hh = (hh.length > 1) ? hh : "0" + hh;
						mins = dateValue.getMinutes() + "";
						mins = (mins.length > 1) ? mins : "0" + mins;
						secs = dateValue.getSeconds() + "";
						secs = (secs.length > 1) ? secs : "0" + secs;
						response = yyyy + "-" + mm + "-" + dd + "T" + hh + ":" + mins + ":" + secs;
						break;
					case "yyyy-MM-dd hh:MM:ss":
						hh = dateValue.getHours() + "";
						hh = (hh.length > 1) ? hh : "0" + hh;
						mins = dateValue.getMinutes() + "";
						mins = (mins.length > 1) ? mins : "0" + mins;
						secs = dateValue.getSeconds() + "";
						secs = (secs.length > 1) ? secs : "0" + secs;
						response = yyyy + "-" + mm + "-" + dd + " " + hh + ":" + mins + ":" + secs;
						break;
					case "hh:MM:ss":
						hh = dateValue.getHours() + "";
						hh = (hh.length > 1) ? hh : "0" + hh;
						mins = dateValue.getMinutes() + "";
						mins = (mins.length > 1) ? mins : "0" + mins;
						secs = dateValue.getSeconds() + "";
						secs = (secs.length > 1) ? secs : "0" + secs;
						response = hh + ":" + mins + ":" + secs;
						break;
					case "dd/MM/yyyy hh:MM:ss":
						response = dd + "/" + mm + "/" + yyyy + " ";
						hh = dateValue.getHours() + "";
						hh = (hh.length > 1) ? hh : "0" + hh;
						mins = dateValue.getMinutes() + "";
						mins = (mins.length > 1) ? mins : "0" + mins;
						secs = dateValue.getSeconds() + "";
						secs = (secs.length > 1) ? secs : "0" + secs;
						response += hh + ":" + mins + ":" + secs;
						break;
					case "dd/MM/yyyy hh:MM":
						response = dd + "/" + mm + "/" + yyyy + " ";
						hh = dateValue.getHours() + "";
						hh = (hh.length > 1) ? hh : "0" + hh;
						mins = dateValue.getMinutes() + "";
						mins = (mins.length > 1) ? mins : "0" + mins;
						response += hh + ":" + mins ;
						break;
					default:
						response = dateValue;
						break;
					}
				}
				return response;
			},
			/**
			 * Frame Post Object for Task Completion
			 */
			formatPostData: function (requestData, data, actionCode) {
				var postTaskData = {
					"taskList": []
				};
				var taskData = (data instanceof Array) ? data : [data];
				var isSingle = !(data instanceof Array);
				var taskElement, postElement;
				jQuery.sap.each(taskData, function (l) {
					taskElement = taskData[l];
					if (isSingle || (!isSingle && taskElement.isMassAppAllowed)) {
						//Prepare Task Element
						postElement = {};
						postElement.taskId = taskElement;
						postElement.requestNumber = requestData.requestId;
						postElement.requestType = "PTP";
						postElement.isApproved = true;
						postElement.urgent = requestData.urgentRequest;
						postElement.processName = "PTP Process";
						postElement.completionSource = "Requester Screen";
						postElement.entityName = requestData.entityName;
						postElement.vendorName = requestData.vendorName;
						postElement.serviceCategory = requestData.srCategoryDesp;
						postElement.actionType = (actionCode === "Close Case") ? "Resolved" : (actionCode === "Reopen Case") ? "Reopen" : requestData.srStatusCode;
						postElement.sectorCode = requestData.entityCode;
						postTaskData.taskList.push(postElement);
					}
				});
				return postTaskData;
			},
			//Generate Random Number
			getRandomNo: function () {
				return Math.floor(Math.random() * 1000000000);
			},
			/**
			 * Frame Post Object
			 */
			formatPostDataForCancel: function (data, actionCode, userId) {
				var postTaskData = {
					"requestNumber": data.requestId
				};
				return postTaskData;
			},

			parseObjectData: function (data) {
				if (data) {
					data = JSON.parse(JSON.stringify(data));
				}
				return data;
			},
			getSenderName: function (userType, context) {

				const userName = context.getProperty("userName");
	
				if (userType === "PTP Normal Task") {
	
					return "PTP";
	
				} else {
	
					return userName;
	
				}
	
			}

		});
		return dataformatter;
	});