package com.pangolin.olap.web;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * RequestAuthorizer that authorizes all requests and assigns all requests a pre-defined role, or a null role if none is configured.
 */
@Component
public class DefaultRequestAuthorizer implements RequestAuthorizer {
	
	private final Log log = LogFactory.getLog(DefaultRequestAuthorizer.class);
	
	@Value("${defaultRequestAuthorizerRole:#{null}}")
	private String defaultRequestAuthorizerRole;
	
	@PostConstruct
	public void init() throws Exception {
		log.info("DefaultRequestAuthorizer will use role " + defaultRequestAuthorizerRole + " for connections");
	}
	
	@Override
	public RequestAuthorizationStatus authorizeRequest(HttpServletRequest request, String connectionName) throws Exception {
		RequestAuthorizationStatus ret = new RequestAuthorizationStatus();
		ret.authorized = true;
		ret.token = "[None]";
		// ret.mondrianRole = defaultRequestAuthorizerRole;
		ret.mondrianRole = request.getHeader("mondrian-role");
		return ret;
	}

}
