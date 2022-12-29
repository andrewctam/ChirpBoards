package org.andrewtam.ChirpBoards.GraphQLModels;

public class BooleanResponse {
    private String error;
    private Boolean endRes;

    public BooleanResponse(String error, Boolean endRes) {
        this.error = error;
        this.endRes = endRes;
    }

    public String getError() { return error; }
    public Boolean getEndRes() { return endRes; }


}
