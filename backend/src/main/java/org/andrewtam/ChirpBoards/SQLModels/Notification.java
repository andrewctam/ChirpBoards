package org.andrewtam.ChirpBoards.SQLModels;

import java.text.DateFormat;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    private String id;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String pinged;

    @Column(nullable = false)
    private String pinger;

    @Column(nullable = false)
    private String post;

    @Column(nullable = false)
    private long date;


    public Notification() {}

    public Notification(String type, String pinged, String pinger, String post) {
        this.id = UUID.randomUUID().toString();
        this.type = type;
        this.pinged = pinged;
        this.pinger = pinger;
        this.post = post;
        this.date = System.currentTimeMillis();
    }

    public String getId() { return this.id; }


    public String getType() { return this.type; }
    public void setType(String type) { this.type = type; }

    public String getPinged() { return this.pinged; }
    public void setPinged(String pinged) { this.pinged = pinged; }



    public String getPinger() { return this.pinger; }
    public void setPinger(String pinger) { this.pinger = pinger; }

    public String getPost() { return this.post; }
    public void setPost(String post) { this.post = post; }

    public long getDate() { return this.date; }
    public void setDate(long date) { this.date = date; }


    public String getFormattedDate(int timezone) {
        long adjustedTime = this.date + timezone * 3600000;
        DateFormat df = DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT);
        df.setTimeZone(java.util.TimeZone.getTimeZone("GMT"));
        
        return df.format(adjustedTime);
    }

}
