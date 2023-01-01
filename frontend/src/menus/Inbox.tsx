
import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PostPayload, UserContext, UserPayload } from "../App";
import useScrollBottom from "../hooks/useScrollBottom";
import Layout from "../Layout";
import UserSearchResult from "./UserSearchResult";
import SpinningCircle from "../SpinningCircle";
import Notification from "./Notification";

type NotificationPayload = {
    type: string
    pinger: UserPayload
    post: PostPayload
    date: string
}

function Inbox () {
    const userInfo = useContext(UserContext);
    const [pageNum, setPageNum] = useState(0);
    const [hasNext, setHasNext] = useState(true);
    const [doneLoading, setDoneLoading] = useState(false);
    const [notificationsFeed, setNotificationsFeed] = useState<JSX.Element[]>([]);

    useEffect(() => {
        getNotifications();
    }, [])

    const getNotifications = async () => {
        if (!hasNext) 
            return;
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `query {    
            notifications(pageNum: ${pageNum}, size: 10, username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}") {
                notifications {
                    type
                    pinger {
                        username
                        displayName
                    }
                    post {
                        id
                    }
                    date(timezone: ${timezone})
                }
                hasNext
                unread
            }
        }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({query})
        }).then(res => res.json())
        
        console.log(response)

        let unreadLeft = response.data.notifications.unread
        if (unreadLeft == null) 
            return null;
                    
        
        const info = response.data.notifications
        setPageNum(pageNum + 1)
        setHasNext(info.hasNext)

        setNotificationsFeed(notificationsFeed.concat(
            info.notifications.map((notif: NotificationPayload, i: number) => {
                unreadLeft -= 1
                return <Notification
                    key = {"notification" + i}
                    type = {notif.type}
                    pingerUsername = {notif.pinger.username}
                    pingerDisplayName = {notif.pinger.displayName}
                    date = {notif.date}
                    postId = {notif.post.id}
                    unread = {unreadLeft + 1 > 0} //since we subtracted one above
                /> 
            })
        ));

        setDoneLoading(true)
    }

    useScrollBottom(getNotifications);

    return (
        <Layout>
            <h1 className = "text-2xl text-white text-center py-4 bg-black/20 shadow-md">Inbox</h1>
            <div className="mt-2 mx-auto w-5/6 lg:w-3/5 py-2">                
                <ul className = "w-[95%] mx-auto mt-6"> 
                    { doneLoading ? 
                        notificationsFeed.length == 0 ?
                            <div>
                                <h1 className = "text-lg text-white text-center mt-2">No notifications found</h1>
                            </div> 
                            : notificationsFeed
                        : <SpinningCircle />
                    } 
                </ul>
            </div>
        </Layout>
    )
}



export default Inbox