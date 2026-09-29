export const BASE_URL = "https://appapi.aiworksforce.com/api";
//https://live-project-backend-1.onrender.com
//https://propertyapi.aileadgenie.cloud/api
//https://apidomain.ibigdata.in
//https://apiedu.ibigdata.in
//https://apiwbh.ibigdata.in
//https://apiproperty.ibigdata.in
//https://apitravel.ibigdata.in
//https://appapi.estateai.in

export const API_ROUTES = {
  CONTACT: {
    GET_ALL: `${BASE_URL}/contact`,
    GET_BY_ID: (id: string) => `${BASE_URL}/contact/${id}`,
    GET_BY_PARAMS: (params: string) => `${BASE_URL}/contact?${params}`,
    ADD: `${BASE_URL}/contact`,
    UPDATE: (id: string) => `${BASE_URL}/contact/${id}`,
    DELETE: (id: string) => `${BASE_URL}/contact/${id}`,
    DELETEALL: `${BASE_URL}/contact/delete/all`,
    CONTACTIMPORT: `${BASE_URL}/contact/import`,
    CONTACTEXCELHEADERS: `${BASE_URL}/contact/import/headers`,
    ASSIGNCONTACT: `${BASE_URL}/contact/assign`
  },
  CUSTOMER: {
    DASHBOARD_STATS_COUNT: `${BASE_URL}/customer/dashboard/stats-count`,
    DISTRIBUTION_COUNT: (groupby: string) => `${BASE_URL}/customer/dashboard/distribution?groupBy=${groupby}`,
    EMPLOYEE_HIGHLIGHTS: `${BASE_URL}/customer/dashboard/employee/highlights`,
    LEADSOURCE_STATS: `${BASE_URL}/customer/dashboard/lead-source-stats`,
    LEADTEMPERATURE_STATS: `${BASE_URL}/customer/dashboard/lead-temperature-stats`,
    VISITER_CHART_STATS: `${BASE_URL}/customer/dashboard/visiter-chart-stats`,
    FOLLOWUP_CHART_STATS: `${BASE_URL}/customer/dashboard/followup-chart-stats`,
    LOCATION_STATS: `${BASE_URL}/customer/dashboard/customer-location-stats`,
    RADAR_CHART_STATS: `${BASE_URL}/customer/dashboard/radar-chart-stats`,
    GET_ALL: `${BASE_URL}/customer`,
    GET_CUSTOMER_FIELDS_VALUES: `${BASE_URL}/customer/get-customer-fields-values`,
    GET_ALL_TOTAL: `${BASE_URL}/customer/all`,
    GET_CUSTOMER_COUNT: `${BASE_URL}/customer/count`,
    GET_FAVOURITES_CUSTOMER: `${BASE_URL}/customer/favouriteS/all`,
    GET_TODAY_ALL: `${BASE_URL}/customer/today`,
    GET_BY_ID: (id: string) => `${BASE_URL}/customer/${id}`,
    GET_BY_PARAMS: (params: string) => `${BASE_URL}/customer?${params}`,
    CHECKDUPLICATES: `${BASE_URL}/customer/check-duplicates`,
    ADD: `${BASE_URL}/customer`,
    UPDATE: (id: string) => `${BASE_URL}/customer/${id}`,
    DELETE: (id: string) => `${BASE_URL}/customer/${id}`,
    DELETEALL: `${BASE_URL}/customer`,
    CUSTOMERIMPORT: `${BASE_URL}/customer/import`,
    CUSTOMEREXCELHEADERS: `${BASE_URL}/customer/import/headers`,
    ASSIGNCUSTOMER: `${BASE_URL}/customer/assign`,
    QUALIFYCUSTOMER: `${BASE_URL}/customer/qualification-agent`,
    DATAMINING: `${BASE_URL}/customer/data-mining`,
    RECOMENDCUSTOMER: `${BASE_URL}/customer/recommended-customers`,
    AGENTCALLING: `${BASE_URL}/customer/agent-call`,
    GETCALLLOGS: `${BASE_URL}/customer/getcalllogs`,
    GETCALLREPORT: `${BASE_URL}/customer/get-call-report`,
    DELETECALLLOG: (id: string) => `${BASE_URL}/customer/delete-calllog/${id}`,

    GETCLOSEDDEAL: `${BASE_URL}/customer/closed-deals`,
    GET_CLOSEDDEAL_BY_PARAMS: (params: string) => `${BASE_URL}/customer/closed-deals?${params}`,
    CLOSEDEAL: (id: string) => `${BASE_URL}/customer/close-deal/${id}`,
    REOPENDEAL: (id: string) => `${BASE_URL}/customer/reopen-deal/${id}`,

    GETARCHIEVEDCUSTOMER: `${BASE_URL}/customer/archived`,
    GET_ARCHIEVEDCUSTOMER_BY_PARAMS: (params: string) => `${BASE_URL}/customer/archived?${params}`,
    ARCHIEVECUSTOMER: `${BASE_URL}/customer/archive`,
    UNARCHIEVECUSTOMER: `${BASE_URL}/customer/unarchive`,

    ADDSHORTLIST: `${BASE_URL}/customer/shortlist`,
    GETSHORTLIST: (id: string) => `${BASE_URL}/customer/shortlist/${id}`,
    REMOVESHORTLIST: `${BASE_URL}/customer/shortlist`,
    UPDATESHORTLIST: `${BASE_URL}/customer/shortlist`,

    LOGIN: `${BASE_URL}/customer/login`,
    CHECK_AUTH: `${BASE_URL}/customer/check-auth`,
    LOGOUT: `${BASE_URL}/customer/logout`,
    PORTAL_DASHBOARD: `${BASE_URL}/customer/portal-dashboard`,
    PORTAL_UPDATES: `${BASE_URL}/customer/portel-updates`
  },
  ENQUIRY: {
    // Customer Endpoints
    CREATE_CUSTOMER: `${BASE_URL}/enquiry/customer`,
    GET_ALL_CUSTOMER: `${BASE_URL}/enquiry/customer`,
    GET_CUSTOMER_BY_ID: (id: string) => `${BASE_URL}/enquiry/customer/${id}`,
    REPLY_CUSTOMER: (id: string) => `${BASE_URL}/enquiry/customer/${id}/reply`,

    // Admin Endpoints
    GET_ALL_ADMIN: `${BASE_URL}/enquiry/admin`,
    GET_ALL_ADMIN_PARAMS: (params: string) => `${BASE_URL}/enquiry/admin?${params}`,
    GET_ADMIN_BY_ID: (id: string) => `${BASE_URL}/enquiry/admin/${id}`,
    REPLY_ADMIN: (id: string) => `${BASE_URL}/enquiry/admin/${id}/reply`,
    UPDATE_STATUS: (id: string) => `${BASE_URL}/enquiry/admin/${id}/status`,
  },
  ATTENDANCE: {
    // -----------------------------------------
    // EMPLOYEE (CUSTOMER) ENDPOINTS
    // -----------------------------------------
    EMPLOYEE_LOGIN: `${BASE_URL}/attendance/employee/login`,
    EMPLOYEE_CHECK: `${BASE_URL}/attendance/employee/check`,
    EMPLOYEE_LOGOUT: `${BASE_URL}/attendance/employee/logout`,
    CLOCK_IN: `${BASE_URL}/attendance/employee/clock-in`,
    CLOCK_OUT: `${BASE_URL}/attendance/employee/clock-out`,
    GET_BY_ID: (id: string) => `${BASE_URL}/attendance/employee/${id}`,

    GET_ALL: `${BASE_URL}/attendance/employee`,
    // 🚨 NEW: Added Params route
    GET_BY_PARAMS: (params: string) => `${BASE_URL}/attendance/employee?${params}`,
    CREATE: `${BASE_URL}/attendance/employee`,
    UPDATE: (id: string) => `${BASE_URL}/attendance/employee/${id}`,
    DELETE: `${BASE_URL}/attendance/employee`,

    // Gets default current month report
    GET_EMPLOYEE_REPORT: `${BASE_URL}/attendance/employee/report`,

    // Allows filtering, e.g., params = "month=2026-09"
    GET_EMPLOYEE_REPORT_BY_PARAMS: (params: string) => `${BASE_URL}/attendance/employee/report?${params}`,
    EMPLOYEE_MANUAL_UPDATE: `${BASE_URL}/attendance/employee/manual-update`,

    // -----------------------------------------
    // ADMIN ENDPOINTS
    // -----------------------------------------
    ADMIN_UPDATE_ATTENDANCE: `${BASE_URL}/attendance/admin/update`,

    // Gets default current month report for all employees
    GET_ADMIN_REPORT: `${BASE_URL}/attendance/admin/report`,

    // Allows filtering, e.g., params = "month=2026-09&employeeId=123&limit=50&skip=0"
    GET_ADMIN_REPORT_BY_PARAMS: (params: string) => `${BASE_URL}/attendance/admin/report?${params}`,
    GET_ATTENDANCE_TREND: (startDate: string, endDate: string) => `${BASE_URL}/attendance/trend?startDate=${startDate}&endDate=${endDate}`,
    GET_ATTENDANCE_OVERVIEW: (startDate: string, endDate: string) => `${BASE_URL}/attendance/overview?startDate=${startDate}&endDate=${endDate}`

  },
  COMPANYPROJECTS: {
    GET_ALL: `${BASE_URL}/com/pro`,
    GET_BY_ID: (id: string) => `${BASE_URL}/com/pro/${id}`,
    GET_BY_PARAMS: (params: string) => `${BASE_URL}/com/pro?${params}`,
    ADD: `${BASE_URL}/com/pro`,
    UPDATE: (id: string) => `${BASE_URL}/com/pro/${id}`,
    DELETE: (id: string) => `${BASE_URL}/com/pro/${id}`,
  },
  FOLLOWUPS: {
    CUSTOMER: {
      GET_ALL: `${BASE_URL}/cus/followup`,
      GET_CUSTOMER_FOLLOWUP: (id: string) => `${BASE_URL}/cus/followup/customer/${id}`,
      GET_FOLLOWUP_By_ID: (id: string) => `${BASE_URL}/cus/followup/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/cus/followup?${params}`,
      ADD: (id: string) => `${BASE_URL}/cus/followup/${id}`,
      UPDATE: (id: string) => `${BASE_URL}/cus/followup/${id}`,
      CUSTOMER_FOLLOWUP_DELETE: (id: string) => `${BASE_URL}/cus/followup/customer/${id}`,
      FOLLOWUP_DELETE: (id: string) => `${BASE_URL}/cus/followup/${id}`,
      ADDAIFOLLOWUP: `${BASE_URL}/cus/followup/aifollowup`,
    },
    CONTACT: {
      GET_ALL: `${BASE_URL}/con/follow/add`,
      GET_CONTACT_FOLLOWUP: (id: string) => `${BASE_URL}/con/follow/add/contact/${id}`,
      GET_FOLLOWUP_By_ID: (id: string) => `${BASE_URL}/con/follow/add/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/con/follow/add?${params}`,
      ADD: (id: string) => `${BASE_URL}/con/follow/add/${id}`,
      UPDATE: (id: string) => `${BASE_URL}/con/follow/add/${id}`,
      CONTACT_FOLLOWUP_DELETE: (id: string) => `${BASE_URL}/con/follow/add/contact/${id}`,
      FOLLOWUP_DELETE: (id: string) => `${BASE_URL}/con/follow/add/${id}`,
    },
  },
  SHEDULES: {
    GET_ALL: `${BASE_URL}/sch`,
    GET_BY_ID: (id: string) => `${BASE_URL}/sch/${id}`,
    GET_BY_PARAMS: (params: string) => `${BASE_URL}/sch?${params}`,
    ADD: `${BASE_URL}/sch`,
    UPDATE: (id: string) => `${BASE_URL}/sch/${id}`,
    DELETE: `${BASE_URL}/sch`,
  },
  TASK: {
    // -----------------------------------------
    // ADMIN ROUTES (CRM Portal)
    // -----------------------------------------
    ADMIN_GET_ALL: `${BASE_URL}/task/admin`,
    ADMIN_GET_BY_PARAMS: (params: string) => `${BASE_URL}/task/admin?${params}`,
    ADMIN_ADD: `${BASE_URL}/task/admin`,
    ADMIN_UPDATE: (id: string) => `${BASE_URL}/task/admin/${id}`,
    ADMIN_DELETE: `${BASE_URL}/task/admin`, // Expects payload { taskIds: [] }

    // -----------------------------------------
    // EMPLOYEE ROUTES (Staff Workspace)
    // -----------------------------------------
    EMPLOYEE_GET_ALL: `${BASE_URL}/task/employee`,
    EMPLOYEE_UPDATE_STATUS: (id: string) => `${BASE_URL}/task/employee/${id}/status`,
    SUBTASK_UPDATE_STATUS: (id: string) => `${BASE_URL}/task/employee/subtask/${id}/status`,

    // -----------------------------------------
    // SUBTASK ROUTES (Staff Workspace)
    // -----------------------------------------
    SUBTASK_ADD: `${BASE_URL}/task/employee/subtask`,
    SUBTASK_TOGGLE: (id: string) => `${BASE_URL}/task/employee/subtask/${id}`,
    SUBTASK_DELETE: (id: string) => `${BASE_URL}/task/employee/subtask/${id}`,

    //AI ROUTES
    GENERATE_SUBTASKS_AI: `${BASE_URL}/task/admin/ai/generate-subtasks`,
    ASSIGN_TASK_AI: `${BASE_URL}/task/admin/ai/assign`,

    EMPLOYEE_SUBMIT_MACRO_REVIEW: (id: string) => `${BASE_URL}/task/employee/${id}/submit-review`,
    SUBTASK_VERIFY_AI: (id: string) => `${BASE_URL}/task/employee/subtask/${id}/verify`,

  },
  NOTIFICATIONS: {
    GET_ALL: `${BASE_URL}/notifications`,
    GET_BY_PARAMS: (params: string) => `${BASE_URL}/notifications?${params}`,
    MARK_READ: (id: string) => `${BASE_URL}/notifications/mark-read/${id}`,
    MARK_ALL_READ: `${BASE_URL}/notifications/mark-all-read`,
  },
  AIAGENT: {
    GET_ALL: `${BASE_URL}/aiagent`,
    GET_BY_ID: (id: string) => `${BASE_URL}/aiagent/${id}`,
    GET_BY_PARAMS: (params: string) => `${BASE_URL}/aiagent?${params}`,
    ADD: `${BASE_URL}/aiagent`,
    UPDATE: (id: string) => `${BASE_URL}/aiagent/${id}`,
    DELETE: (id: string) => `${BASE_URL}/aiagent/${id}`,
    ASSIGNAIAGENT: `${BASE_URL}/aiagent/assign`,
    RUNWEBHOOKAGENT: `${BASE_URL}/aiagent/run-webhook-agent`,
    COMPARE_PRODUCT_PRICE: `${BASE_URL}/aiagent/compare-product-price`,
    GET_AI_REPORT: `${BASE_URL}/aiagent/ai-reports`,

    // Admin Routes
    ADMIN_SEND_MESSAGE: `${BASE_URL}/aiagent/admin/message`,
    ADMIN_GET_SESSIONS: `${BASE_URL}/aiagent/admin/sessions`,
    ADMIN_GET_MESSAGES: (sessionId: string) => `${BASE_URL}/aiagent/admin/sessions/${sessionId}/messages`,
    ADMIN_TOGGLE_PIN: (sessionId: string) => `${BASE_URL}/aiagent/admin/sessions/${sessionId}/pin`,
    ADMIN_DELETE_SESSION: (sessionId: string) => `${BASE_URL}/aiagent/admin/sessions/${sessionId}`,

    // Employee Routes
    EMPLOYEE_SEND_MESSAGE: `${BASE_URL}/aiagent/employee/message`,
    EMPLOYEE_GET_SESSIONS: `${BASE_URL}/aiagent/employee/sessions`,
    EMPLOYEE_GET_MESSAGES: (sessionId: string) => `${BASE_URL}/aiagent/employee/sessions/${sessionId}/messages`,
    EMPLOYEE_TOGGLE_PIN: (sessionId: string) => `${BASE_URL}/aiagent/employee/sessions/${sessionId}/pin`,
    EMPLOYEE_DELETE_SESSION: (sessionId: string) => `${BASE_URL}/aiagent/employee/sessions/${sessionId}`,

    // Customer Routes
    CUSTOMER_SEND_MESSAGE: `${BASE_URL}/aiagent/customer/message`,
    CUSTOMER_GET_SESSIONS: `${BASE_URL}/aiagent/customer/sessions`,
    CUSTOMER_GET_MESSAGES: (sessionId: string) => `${BASE_URL}/aiagent/customer/sessions/${sessionId}/messages`,
    CUSTOMER_TOGGLE_PIN: (sessionId: string) => `${BASE_URL}/aiagent/customer/sessions/${sessionId}/pin`,
    CUSTOMER_DELETE_SESSION: (sessionId: string) => `${BASE_URL}/aiagent/customer/sessions/${sessionId}`,
  },
  TABBLY: {
    GETCURRENTAGENT: `${BASE_URL}/tabbly/current-agent`,
    GETAGENTVOICES: `${BASE_URL}/tabbly/agent-voices`,
    UPDATEAGENT: `${BASE_URL}/tabbly/update-agent`,
  },

  SALESSCRIPT: {
    GET_ALL: `${BASE_URL}/salesscript`,
    GET_BY_ID: (id: string) => `${BASE_URL}/salesscript/${id}`,
    GET_BY_PARAMS: (params: string) => `${BASE_URL}/salesscript?${params}`,
    ADD: `${BASE_URL}/salesscript`,
    UPDATE: (id: string) => `${BASE_URL}/salesscript/${id}`,
    DELETE: (id: string) => `${BASE_URL}/salesscript/${id}`,
  },
  SOCIALCONTENT: {
    REDDIT: {
      GET_BY_QUERY: (query: string) => `${BASE_URL}/social-content/reddit/${query}`,
    },
    FACEBOOK: {
      GET_ALL_POST: `${BASE_URL}/social-content/facebook`,
      GET_BY_QUERY: (query: string) => `${BASE_URL}/social-content/facebook/${query}`,
      SCRAPP_NEW_POSTS: `${BASE_URL}/social-content/facebook/scrap-new`
    },
    INSTAGRAM: {
      GET_ALL_POST: `${BASE_URL}/social-content/instagram`,
      GET_BY_QUERY: (query: string) => `${BASE_URL}/social-content/instagram/${query}`,
      SCRAPP_NEW_POSTS: `${BASE_URL}/social-content/instagram/scrap-new`
    },
    MINEDLEAD: {
      SAVE: `${BASE_URL}/social-content/minedlead/save`,
      GET: `${BASE_URL}/social-content/minedlead/get`,
      GET_BY_QUERY: (params: string) => `${BASE_URL}/social-content/minedlead/get?${params}`,
      CONVERT: `${BASE_URL}/social-content/minedlead/convert`,
    }
  },
  SOCIALMEDIA: {
    INSTAGRAM: {
      GET_LIVE_POST: `${BASE_URL}/social-auth/get-instagram-posts`,
      GET_ANALYTICS: `${BASE_URL}/social-auth/get-instagram-analytics`,
      DISCONNECT_ACCOUNT: `${BASE_URL}/social-auth/disconnect-instagram`,
      SCHEDULE_POST: `${BASE_URL}/social-auth/schedule-instagram-post`,
      GET_SCHEDULED_POST: (params: string) => `${BASE_URL}/social-auth/scheduled-posts-data?platform=${params}`,

    },
    FACEBOOK: {
      GET_LIVE_POST: `${BASE_URL}/social-auth/get-facebook-posts`,
      GET_ANALYTICS: `${BASE_URL}/social-auth/get-facebook-analytics`,
      DISCONNECT_ACCOUNT: `${BASE_URL}/social-auth/disconnect-facebook`,
      SCHEDULE_POST: `${BASE_URL}/social-auth/schedule-facebook-post`,
      GET_SCHEDULED_POST: (params: string) => `${BASE_URL}/social-auth/scheduled-posts-data?platform=${params}`,
    },
    AUTOSOCIALAGENT: {
      RUN: `${BASE_URL}/social-auth/auto-social-agent`
    }
  },
  MASTERS: {
    CAMPAIGN: {
      GET_ALL: `${BASE_URL}/mas/cam`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/cam/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/cam?${params}`,
      ADD: `${BASE_URL}/mas/cam`,
      UPDATE: (id: string) => `${BASE_URL}/mas/cam/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/cam/${id}`,

    },
    TYPES: {
      GET_ALL: `${BASE_URL}/mas/type`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/type/${id}`,
      GET_ALL_BY_CAMPAIGN: (id: string) => `${BASE_URL}/mas/type/campaign/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/type?${params}`,
      ADD: `${BASE_URL}/mas/type`,
      UPDATE: (id: string) => `${BASE_URL}/mas/type/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/type/${id}`,
      DELETEALL: `${BASE_URL}/mas/type`,
    },
    SUBTYPE: {
      GET_ALL: `${BASE_URL}/mas/sub`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/sub/${id}`,
      GET_ALL_BY_CAMPAIGN_AND_TYPE: (campaignid: string, typeid: string) => `${BASE_URL}/mas/sub/filter/${campaignid}/${typeid}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/sub?${params}`,
      ADD: `${BASE_URL}/mas/sub`,
      UPDATE: (id: string) => `${BASE_URL}/mas/sub/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/sub/${id}`,
      DELETEALL: `${BASE_URL}/mas/sub`,
    },

    DEPARTMENT: {
      GET_ALL: `${BASE_URL}/mas/department`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/department/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/department?${params}`,
      ADD: `${BASE_URL}/mas/department`,
      UPDATE: (id: string) => `${BASE_URL}/mas/department/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/department/${id}`,
    },
    DESIGNATION: {
      GET_ALL: `${BASE_URL}/mas/designation`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/designation/${id}`,
      GET_ALL_BY_DEPARTMENT: (id: string) => `${BASE_URL}/mas/designation/department/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/designation?${params}`,
      ADD: `${BASE_URL}/mas/designation`,
      UPDATE: (id: string) => `${BASE_URL}/mas/designation/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/designation/${id}`,
      DELETEALL: `${BASE_URL}/mas/designation`,
    },
    ROLEEMP: {
      GET_ALL: `${BASE_URL}/mas/roleemp`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/roleemp/${id}`,
      GET_ALL_BY_DEPT_AND_DESIG: (departmentId: string, designationId: string) => `${BASE_URL}/mas/roleemp/filter/${departmentId}/${designationId}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/roleemp?${params}`,
      ADD: `${BASE_URL}/mas/roleemp`,
      UPDATE: (id: string) => `${BASE_URL}/mas/roleemp/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/roleemp/${id}`,
      DELETEALL: `${BASE_URL}/mas/roleemp`,
    },
    CITY: {
      GET_ALL: `${BASE_URL}/mas/city`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/city/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/city?${params}`,
      ADD: `${BASE_URL}/mas/city`,
      UPDATE: (id: string) => `${BASE_URL}/mas/city/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/city/${id}`,
    },
    LOCATION: {
      GET_ALL: `${BASE_URL}/mas/loc`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/loc/${id}`,
      GET_ALL_BY_CITY: (id: string) => `${BASE_URL}/mas/loc/city/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/loc?${params}`,
      ADD: `${BASE_URL}/mas/loc`,
      UPDATE: (id: string) => `${BASE_URL}/mas/loc/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/loc/${id}`,
      DELETEALL: `${BASE_URL}/mas/loc`,
    },
    SUBLOCATION: {
      GET_ALL: `${BASE_URL}/mas/subloc`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/subloc/${id}`,
      GET_ALL_BY_CITY_LOCATION: (cityId: string, locationId: string) => `${BASE_URL}/mas/subloc/cityloc/${cityId}/${locationId}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/subloc?${params}`,
      ADD: `${BASE_URL}/mas/subloc`,
      UPDATE: (id: string) => `${BASE_URL}/mas/subloc/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/subloc/${id}`,
      DELETEALL: `${BASE_URL}/mas/subloc`,
    },
    FACILITIES: {
      GET_ALL: `${BASE_URL}/mas/fac`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/fac/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/fac?${params}`,
      ADD: `${BASE_URL}/mas/fac`,
      UPDATE: (id: string) => `${BASE_URL}/mas/fac/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/fac/${id}`,
    },
    AMENITIES: {
      GET_ALL: `${BASE_URL}/mas/amen`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/amen/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/amen?${params}`,
      ADD: `${BASE_URL}/mas/amen`,
      UPDATE: (id: string) => `${BASE_URL}/mas/amen/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/amen/${id}`,
    },
    BUILDERSLIDERS: {
      GET_ALL: `${BASE_URL}/mas/buil`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/buil/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/buil?${params}`,
      ADD: `${BASE_URL}/mas/buil`,
      UPDATE: (id: string) => `${BASE_URL}/mas/buil/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/buil/${id}`,
    },
    FUNCTIONALAREA: {
      GET_ALL: `${BASE_URL}/mas/func`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/func/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/func?${params}`,
      ADD: `${BASE_URL}/mas/func`,
      UPDATE: (id: string) => `${BASE_URL}/mas/func/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/func/${id}`,
    },
    INDUSTRIES: {
      GET_ALL: `${BASE_URL}/mas/ind`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/ind/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/ind?${params}`,
      ADD: `${BASE_URL}/mas/ind`,
      UPDATE: (id: string) => `${BASE_URL}/mas/ind/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/ind/${id}`,
    },
    CONTACTCAMPAIGN: {
      GET_ALL: `${BASE_URL}/mas/contactcampaign`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/contactcampaign/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/contactcampaign?${params}`,
      ADD: `${BASE_URL}/mas/contactcampaign`,
      UPDATE: (id: string) => `${BASE_URL}/mas/contactcampaign/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/contactcampaign/${id}`,
    },
    CONTACTTYPE: {
      GET_ALL: `${BASE_URL}/mas/contacttype`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/contacttype/${id}`,
      GET_ALL_BY_CAMPAIGN: (id: string) => `${BASE_URL}/mas/contacttype/campaign/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/contacttype?${params}`,
      ADD: `${BASE_URL}/mas/contacttype`,
      UPDATE: (id: string) => `${BASE_URL}/mas/contacttype/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/contacttype/${id}`,
    },
    REFERENCES: {
      GET_ALL: `${BASE_URL}/mas/ref`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/ref/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/ref?${params}`,
      ADD: `${BASE_URL}/mas/ref`,
      UPDATE: (id: string) => `${BASE_URL}/mas/ref/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/ref/${id}`,
    },
    LEADTYPE: {
      GET_ALL: `${BASE_URL}/mas/leadtype`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/leadtype/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/leadtype?${params}`,
      ADD: `${BASE_URL}/mas/leadtype`,
      UPDATE: (id: string) => `${BASE_URL}/leadtype/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/leadtype/${id}`,
    },
    PRICE: {
      GET_ALL: `${BASE_URL}/mas/price`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/price/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/price?${params}`,
      ADD: `${BASE_URL}/mas/price`,
      UPDATE: (id: string) => `${BASE_URL}/mas/price/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/price/${id}`,
    },
    CUSTOMERFIELDS: {
      GET_ALL: `${BASE_URL}/mas/customerFields`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/customerFields/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/customerFields?${params}`,
      ADD: `${BASE_URL}/mas/customerFields`,
      UPDATE: (id: string) => `${BASE_URL}/mas/customerFields/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/customerFields/${id}`,
    },

    // 🔹 NEW MASTER MODULES ADDED BELOW 🔹
    EXPENSES: {
      GET_ALL: `${BASE_URL}/mas/exp`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/exp/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/exp?${params}`,
      ADD: `${BASE_URL}/mas/exp`,
      UPDATE: (id: string) => `${BASE_URL}/mas/exp/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/exp/${id}`,
    },
    INCOME: {
      GET_ALL: `${BASE_URL}/mas/inc`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/inc/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/inc?${params}`,
      ADD: `${BASE_URL}/mas/inc`,
      UPDATE: (id: string) => `${BASE_URL}/mas/inc/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/inc/${id}`,
    },
    STATUSTYPE: {
      GET_ALL: `${BASE_URL}/mas/statustype`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/statustype/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/statustype?${params}`,
      ADD: `${BASE_URL}/mas/statustype`,
      UPDATE: (id: string) => `${BASE_URL}/mas/statustype/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/statustype/${id}`,
    },
    CONTACTSTATUSTYPE: {
      GET_ALL: `${BASE_URL}/mas/con/statustype`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/con/statustype/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/con/statustype?${params}`,
      ADD: `${BASE_URL}/mas/con/statustype`,
      UPDATE: (id: string) => `${BASE_URL}/mas/con/statustype/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/con/statustype/${id}`,
    },
    PAYMENTS: {
      GET_ALL: `${BASE_URL}/mas/payments`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/payments/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/payments?${params}`,
      ADD: `${BASE_URL}/mas/payments`,
      UPDATE: (id: string) => `${BASE_URL}/mas/payments/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/payments/${id}`,
    },
    SMS: {
      GET_ALL: `${BASE_URL}/mas/sms`,
      GET_BY_ID: (id: string) => `${BASE_URL}/mas/sms/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/mas/sms?${params}`,
      ADD: `${BASE_URL}/mas/sms`,
      UPDATE: (id: string) => `${BASE_URL}/mas/sms/${id}`,
      DELETE: (id: string) => `${BASE_URL}/mas/sms/${id}`,
    },
    MAIL: {
      GET_ALL: `${BASE_URL}/v1/templates?type=email`,
      GET_BY_ID: (id: string) => `${BASE_URL}/v1/templates/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/v1/templates?${params}`,
      ADD: `${BASE_URL}/v1/templates`,
      UPDATE: (id: string) => `${BASE_URL}/v1/templates/${id}`,
      DELETE: (id: string) => `${BASE_URL}/v1/templates/${id}`,
      MAILALL: `${BASE_URL}/v1/messages/email`,
      FILEUPLOAD: `${BASE_URL}/v1/messages/uploads/file`,
      SEND_EMAIL_VIA_AI: `${BASE_URL}/v1/messages/send-email-via-ai`
    },
    WHATSAPP: {
      GET_ALL: `${BASE_URL}/v1/templates?type=whatsapp`,
      GET_BY_ID: (id: string) => `${BASE_URL}/v1/templates/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/v1/templates?${params}`,
      ADD: `${BASE_URL}/v1/templates`,
      UPDATE: (id: string) => `${BASE_URL}/v1/templates/${id}`,
      DELETE: (id: string) => `${BASE_URL}/v1/templates/${id}`,
      WHATSAPPALL: `${BASE_URL}/v1/messages/whatsapp`,
      WHATSAPP_CONNECTION_STATUS: `${BASE_URL}/v1/messages/whatsapp-connection-status`,
      WHATSAPP_CONNECTION_LOGOUT: `${BASE_URL}/v1/messages/whatsapp-connection-logout`,
      WHATSAPP_STOP_IDLE: `${BASE_URL}/v1/messages/whatsapp-stop-idle`,
      WHATSAPP_CONNECTION_PAIRING_CODE: `${BASE_URL}/v1/messages/whatsapp-connection-pairing-code`,
      WHATSAPP_PROPERTIES: `${BASE_URL}/v1/messages/whatsapp/send-properties`,
      WHATSAPP_DIRECT_MESSAGE: `${BASE_URL}/v1/messages/whatsapp/direct-message`,
    },
    CALL: {
      CALLCUSTOMER: `${BASE_URL}/v1/messages/call`
    }
  },
  SETTINGS: {
    CUSTOMERFIELDLABEL: {
      GET_ALL: `${BASE_URL}/customerfieldlabels`,
      UPDATE: `${BASE_URL}/customerfieldlabels`,
    }
  },
  FINANCIAL: {
    INCOMEMARKETING: {
      GET_ALL: `${BASE_URL}/fin/inc`,
      GET_BY_ID: (id: string) => `${BASE_URL}/fin/inc/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/fin/inc?${params}`,
      ADD: `${BASE_URL}/fin/inc`,
      UPDATE: (id: string) => `${BASE_URL}/fin/inc/${id}`,
      DELETE: (id: string) => `${BASE_URL}/fin/inc/${id}`,
    },
    EXPENSEMARKETING: {
      GET_ALL: `${BASE_URL}/fin/exp`,
      GET_BY_ID: (id: string) => `${BASE_URL}/fin/exp/${id}`,
      GET_BY_PARAMS: (params: string) => `${BASE_URL}/fin/exp?${params}`,
      ADD: `${BASE_URL}/fin/exp`,
      UPDATE: (id: string) => `${BASE_URL}/fin/exp/${id}`,
      DELETE: (id: string) => `${BASE_URL}/fin/exp/${id}`,
    }
  },
  FAVOURITES: {
    GET_ALL: `${BASE_URL}/favourites`,
    GET_BY_ID: (id: string) => `${BASE_URL}/favourites/${id}`,
    GET_BY_PARAMS: (params: string) => `${BASE_URL}/favourites?${params}`,
    ADD: `${BASE_URL}/favourites`,
    UPDATE: (id: string) => `${BASE_URL}/favourites/${id}`,
    DELETE: (id: string) => `${BASE_URL}/favourites/${id}`,
  },
  VIDEOPROJECT: {

    ADDPHOTOS: `${BASE_URL}/video-project/photos`,
    GENERATESCRIPT: `${BASE_URL}/video-project/script`,
    RENDER: `${BASE_URL}/video-project/render`,
  },
  BRAND: {
    GET: `${BASE_URL}/brand/get`,
    UPDATE: `${BASE_URL}/brand/update`,
  },



  ACTIVITY: {
    GETFEED: `${BASE_URL}/activity/feed`,
    GETSUMMARY: `${BASE_URL}/activity/summary`,
    GETUSERS: `${BASE_URL}/activity/users`,
    GETTIMELINE: (adminId: string) => `${BASE_URL}/activity/timeline/${adminId}`,
    GETCUSTOMERS: `${BASE_URL}/activity/customers`,
    GETFOLLOWUPS: `${BASE_URL}/activity/followups`,
    GETRECORD: (entity: string, id: string) => `${BASE_URL}/activity/record/${entity}/${id}`,
  },


  ADMIN: {
    // 🔓 Public Routes
    SIGNUP: `${BASE_URL}/admin/signup`,
    LOGIN: `${BASE_URL}/admin/login`,
    LOGOUT: `${BASE_URL}/admin/logout`,
    AI: {
      SAVE_API_KEY: `${BASE_URL}/admin/ai/save-api-key`,
      GET_ALL: `${BASE_URL}/admin/ai/get-all`,
      UPDATE_API_KEY: (id: string) => `${BASE_URL}/admin/ai/update-api-key/${id}`,
      DELETE_API_KEY: (id: string) => `${BASE_URL}/admin/ai/delete-api-key/${id}`
    },

    // 🔐 Protected Routes
    CHECK: `${BASE_URL}/admin/check`,

    // 👤 Admin Management
    CREATE: `${BASE_URL}/admin/create`,
    GET_ALL: `${BASE_URL}/admin/all`,
    GET_BY_ID: (id: String) => `${BASE_URL}/admin/${id}`,
    UPDATE_DETAILS: (id: String) => `${BASE_URL}/admin/${id}/details`,
    UPDATE_PASSWORD: (id: String) => `${BASE_URL}/admin/${id}/password`,
    DEVLOGIN: `${BASE_URL}/admin/mode/dev/login`,
    DELETE: (id: String) => `${BASE_URL}/admin/${id}`,
    MY_ACTIVE_AGENTS: `${BASE_URL}/admin/my-active-agents`,

    GENERATE_CRM_API_KEY: `${BASE_URL}/admin/generate-crm-api-key`,
    DELETE_CRM_API_KEY: (keyId: string) => `${BASE_URL}/admin/crm-api-key/${keyId}`,
    GET_CRM_API_KEYS: `${BASE_URL}/admin/crm-api-keys`
  },

  REQUESTUSER: {
    SIGNUP: `${BASE_URL}/user/newusersignup`,
    GET_ALL: `${BASE_URL}/user/newusers`,
    ACCEPTREQUEST: (id: String) => `${BASE_URL}/user/newusers/${id}`,
    DENYREQUEST: (id: String) => `${BASE_URL}/user/newusers/${id}`
  }
};

export const API_URL = "https://appapi.aiworksforce.com";
