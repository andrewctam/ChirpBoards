
interface NotificationProps {
    type: string
    pingerUsername: string
    pingerDisplayName: string
    date: string
    postId: string    
    unread: boolean
}


function Notification(props: NotificationProps)  {
    
    let msg = ""
    switch (props.type) {
        case "reply":
            msg = `${props.pingerDisplayName} (@${props.pingerUsername}) replied to your post`
            break;
        default:
            break;
    }

    return (
        <a href = {`/board/${props.postId}`}>
        <li className = "border border-black p-4 text-white bg-black/20 rounded my-3 relative">
            <div className = "inline text-sm">{props.date}</div>
            <div> {msg} </div>

            {props.unread ?
                <div className = "absolute -top-1 -left-1 p-1 rounded-full bg-rose-400" />: null}


        </li>
        </a>

    )
}

export default Notification;