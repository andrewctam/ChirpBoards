package org.andrewtam.ChirpBoards.MongoDBModels;

import java.text.DateFormat;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("notifications")
public class Notification {

    @Id
    private ObjectId id;

    private String type;
    private ObjectId pinged;
    private ObjectId pinger;
    private ObjectId post;
    private long date;

    public Notification(String type, ObjectId pinged, ObjectId pinger, ObjectId post) {
        this.type = type;
        this.pinged = pinged;
        this.pinger = pinger;
        this.post = post;
        this.date = System.currentTimeMillis();
    }

    public ObjectId getId() { return this.id; }


    public String getType() { return this.type; }
    public void setType(String type) { this.type = type; }

    public ObjectId getPinged() { return this.pinged; }
    public void setPinged(ObjectId pinged) { this.pinged = pinged; }



    public ObjectId getPinger() { return this.pinger; }
    public void setPinger(ObjectId pinger) { this.pinger = pinger; }

    public ObjectId getPost() { return this.post; }
    public void setPost(ObjectId post) { this.post = post; }

    public long getDate() { return this.date; }
    public void setDate(long date) { this.date = date; }


    public String getFormattedDate(int timezone) {
        long adjustedTime = this.date + timezone * 3600000;
        DateFormat df = DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT);
        df.setTimeZone(java.util.TimeZone.getTimeZone("GMT"));
        
        return df.format(adjustedTime);
    }

}
