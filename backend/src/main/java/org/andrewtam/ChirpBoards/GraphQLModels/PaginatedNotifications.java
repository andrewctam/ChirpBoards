package org.andrewtam.ChirpBoards.GraphQLModels;

import java.util.List;
import java.util.ArrayList;

import org.andrewtam.ChirpBoards.SQLModels.Notification;
import org.springframework.data.domain.Page;

public class PaginatedNotifications {
    private List<Notification> notifications;
    private Boolean hasNext;
    private Integer unread;

    public PaginatedNotifications(Page<Notification> page, Integer unread) {
        if (page == null) {
            notifications = new ArrayList<>();
            hasNext = false;
            unread = 0;
        } else {
            notifications = page.getContent();
            hasNext = page.hasNext();
            this.unread = unread;

        }
    }

    public List<Notification> getNotifications() { return notifications; }
    public Boolean getHasNext() { return hasNext; }
    public Integer getTotal() { return unread; }
}

