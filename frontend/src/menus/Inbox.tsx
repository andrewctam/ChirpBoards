
import { useContext, useEffect, useState } from "react";
import { PostPayload, UserContext, UserPayload } from "../App";
import useScrollBottom from "../hooks/useScrollBottom";
import Layout from "../Layout";
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
    const [doneFetching, setDoneFetching] = useState(false);
    const [notificationsFeed, setNotificationsFeed] = useState<JSX.Element[]>([]);

    useEffect(() => {
        getNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const getNotifications = async () => {
        if (!hasNext) 
            return;
        setDoneFetching(false)

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

        //number of unread notifications left. from the top, go down and mark each one as unread while > 0
        let unreadLeft = response.data.notifications.unread 
                    
        const info: {hasNext: boolean, notifications: NotificationPayload[]} = response.data.notifications
        setPageNum(pageNum + 1)
        setHasNext(info.hasNext)

        setNotificationsFeed(notificationsFeed.concat(
            info.notifications.map((notif: NotificationPayload, i: number) => {
                unreadLeft -= 1
                let postId = null
                if (notif.post !== null) //in case post was deleted
                    postId = notif.post.id;
                
                return <Notification
                    key = {"notification" + i}
                    type = {notif.type}
                    pingerUsername = {notif.pinger.username}
                    pingerDisplayName = {notif.pinger.displayName}
                    date = {notif.date}
                    postId = {postId}
                    unread = {unreadLeft + 1 > 0} //since we subtracted one above
                /> 
            })
        ));

        setDoneFetching(true);
    }

    const clearNotifications = async () => {
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `mutation {    
            clearNotifications(username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}")
        }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({query})
        }).then(res => res.json())
        
        console.log(response);

        setNotificationsFeed([]);
        setPageNum(0);
    }

    useScrollBottom(async () => {
        await getNotifications();
    })

    return (
        <Layout>
            <h1 className = "text-2xl text-white text-center p-4 bg-black/20 shadow-md">Inbox</h1>

            {notificationsFeed.length === 0 ?
                <div className = "text-center mt-4">
                    <h1 className = "text-xl text-white">No Notifications Yet</h1>
                </div>
                :
                <div className="mt-2 mx-auto w-5/6 lg:w-3/5 pt-2 pb-12">
                    <div className = "text-center">
                        <button
                            onClick = {clearNotifications} 
                            className = "mx-auto bg-black/20 text-white p-4 border border-black/20 rounded-md py-2">
                            Clear Notifications
                        </button>
                    </div>
                    
                    <ul className = "w-[95%] mx-auto mt-6"> 
                        {notificationsFeed}
                    </ul>
                </div>
            }
            
            {!doneFetching ? <SpinningCircle /> : null}
        </Layout>
    )
}



export default Inbox