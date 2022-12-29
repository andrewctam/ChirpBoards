package org.andrewtam.ChirpBoards.GraphQLModels;

public class LoginRegisterResponse {
    private String msg;
    private String sessionToken;

    public LoginRegisterResponse(String msg, String sessionToken) {
        this.msg = msg;
        this.sessionToken = sessionToken;
    }

    public String getMsg() { return msg; }

    public String getSessionToken() { return sessionToken; }


}
