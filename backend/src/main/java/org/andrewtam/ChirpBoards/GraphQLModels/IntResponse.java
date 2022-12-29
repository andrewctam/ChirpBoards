package org.andrewtam.ChirpBoards.GraphQLModels;

public class IntResponse {
    private String msg;
    private Integer endRes;

    public IntResponse(String msg, Integer endRes) {
        this.msg = msg;
        this.endRes = endRes;
    }

    public String getMsg() { return msg; }
    public Integer getEndRes() { return endRes; }
    
}
