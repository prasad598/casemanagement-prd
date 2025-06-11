sap.ui.define([],
	function (JSONModel) {

		var config = ("ap.portal.util.configuration", {

			sfOperations: {
				imageUrl: "/odata/v2/Photo(photoType=20,",
				usersUrl: "/odata/v2/User?$filter=userid eq ",
				gwSFUrl: "/sap/opu/odata/SAP/ZHR_SUCCESSFACT_EMPPHOTO_SRV/EMPPHOTOSet(photoType=20,"
			},
			processOperations: {
				loggedInUserUrl: "/poutil/rest/BPM/retrieveLoginUserDetails",
				massCompleteTaskUrl: "/poutil/rest/BPM/completeTaskFromCustomInbox"

			},
			dbOperations: {
				
				saveNSubmitRequestUrl: "/poutil/rest/PTP/createServiceRequest",
				serviceRequestsUrl: "/poutil/rest/PTP/retrieveServiceRequestByRequestor",
				serviceRequestsUrl1: "/poutil/rest/PTP/retrieveServiceRequestByRequestorId/",
				loadUserConfigUrl: "/poutil/rest/OTC/retrieveUserMapping/R",
				notificationRequestDeleteUrl: "/poutil/rest/OTC/deleteNotificationRequest/",
				deleteDraftRequest : "/poutil/rest/PTP/deleteServiceRequestDataByDraftId/",
				deleteAttachment : "/poutil/rest/File/delete/",
				loadLookupData: "/poutil/rest/PTP/retrievePTPLookup/",
				fetchTaskDetail: "/poutil/rest/VM/fetchTaskDetail/",
				saveNSubmitPTPRequestUrl: "/poutil/rest/PTP/createServiceRequestViaTask",
				cancelProcess: "/poutil/rest/BPM/cancelProcessByRequestNumber",
				cancelRequest: "/poutil/rest/PTP/cancelServiceRequest/"

			},
			gwTaskOperations: {
				companyCodeUrl: "/sap/opu/odata/sap/ZFI_OTC_BILLINGREQUEST_SRV/Billreq_UserCompanySet",
				baseBillingUrl: "/sap/opu/odata/sap/ZFI_OTC_BILLINGREQUEST_SRV",
				taxCodeUrl: "/sap/opu/odata/sap/ZFI_OTC_BILLINGREQUEST_SRV/Billreq_TaxCodeRateSet?$filter=TaxCode eq '@filterVal'",
				exchangeRateUrl: "/sap/opu/odata/sap/ZFI_OTC_BILLINGREQUEST_SRV/currencySet/",
				metadata: "/$metadata?sap-client=888&sap-language=EN",
				batchUrl: "/$batch?sap-client=888"
			}

		});
		return config;
	});