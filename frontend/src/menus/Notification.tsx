
interface NotificationProps {
    type: string
    pingerUsername: string
    pingerDisplayName: string
    date: string
    postId: string | null
    unread: boolean
}


function Notification(props: NotificationProps)  {
    
    let msg = ""
    switch (props.type) {
        case "reply":
            msg = `${props.pingerDisplayName} (@${props.pingerUsername}) replied to your chirp`
            break;
        case "ping":
            if (props.postId === null)
                msg = `${props.pingerDisplayName} (@${props.pingerUsername}) pinged you (in a deleted post)`
            else
                msg = `${props.pingerDisplayName} (@${props.pingerUsername}) pinged you`
            break;
        default:
            break;
    }

    return (
        <a href = {props.postId ? `/board/${props.postId}` : ""}>
            <li className = "p-4 text-white bg-black/20 rounded my-3 relative shadow-md">
                <div className = "inline text-sm">{props.date}</div>
                <div> {msg} </div>

                {props.unread ?
                    <div className = "absolute -top-1 -left-1 p-1 rounded-full bg-rose-400" />: null}


            </li>
        </a>

    )
}

export default Notification;