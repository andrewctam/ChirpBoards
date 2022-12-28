package org.andrewtam.ChirpBoards.GraphQLModels;

public class LoginRegisterResponse {
    private String error;
    private String sessionToken;

    public LoginRegisterResponse(String error, String sessionToken) {
        this.error = error;
        this.sessionToken = sessionToken;
    }

    public String getError() { return error; }

    public String getSessionToken() { return sessionToken; }


}
