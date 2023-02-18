import { UserToFollow } from "./SideInfo";

const SuggestedUser = (props: UserToFollow) => {
    let relation = "";
    switch (props.relation) {
        case "popular":
            relation = "Popular user"
            break;
        case "follower":
            relation = "Follows you"
            break;
        case "distant following":
            relation = `Followed by ${props.distant}`
            break;
        default:
            break;
    }
    return (
        <div className="text-white w-3/4 lg:w-1/2 mx-auto text-left rounded border border-black p-2 bg-black/10 mt-3 truncate">
            <a href = {`/profile/${props.username}`}>
                <div>
                    <span style={{color: props.userColor}}>
                        {props.displayName}
                    </span>
                    <span className = "mx-1">
                        • 
                    </span>
                    <span className="text-sm">
                        {`@${props.username}`}
                    </span>
                </div>
            </a>

            <div className="text-sm">
                {relation}
            </div>

            
        </div>

    )
}

export default SuggestedUser