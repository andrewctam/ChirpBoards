import { useContext, useState } from "react";
import { UserContext } from "../App";
import UserPhoto from "../UserPhoto";
import { Relation, UserToFollow } from "./SideInfo";

interface SuggestedUserProps extends UserToFollow {
    changeFollowingCount: (change: number) => void;
    refreshFollowing: () => void;
}

const SuggestedUser = (props: SuggestedUserProps) => {
    const userInfo = useContext(UserContext)

    const [isFollowing, setIsFollowing] = useState(props.isFollowing ?? false)
    const [currentlySending, setCurrentlySending] = useState(false);

    const toggleFollow = async (e: React.MouseEvent<HTMLButtonElement> ) => {
        e.preventDefault();
        if (!userInfo.state.username) {
            return;
        }

        // optimistic update
        if (currentlySending) {
            return;
        } else if (isFollowing) {
            setIsFollowing(false);
            props.changeFollowingCount(-1);
        } else {
            setIsFollowing(true);
            props.changeFollowingCount(1);
        }

        setCurrentlySending(true);
        const url = import.meta.env.DEV ? import.meta.env.VITE_DEV_URL : import.meta.env.VITE_PROD_URL

        const query =
        `mutation {    
            toggleFollow(userToFollow: "${props.username}", username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}") {
                msg
                endRes
            }
        }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({query})
        }).then(res => res.json())
        props.refreshFollowing();
        setCurrentlySending(false);
        console.log(response)
    }

    let relation = "";
    switch (props.relation) {
        case Relation.Popular:
            relation = "Popular user"
            break;
        case Relation.Follower:
            relation = "Follows you"
            break;
        case Relation.DistantFollowing:
            relation = `Followed by ${props.distant}`
            break;
        default:
            break;
    }
    return (
        <a href = {`/profile/${props.username}`}>
            <div className="text-white w-3/4 lg:w-1/2 mx-auto text-left rounded p-2 bg-black/20 mt-3 truncate shadow-md relative">
                    { userInfo.state.username ?
                        <button onClick = {toggleFollow} 
                            className = {`py-1 px-2 shadow-md rounded absolute text-sm top-2 right-2 z-20 ${isFollowing ? "hover:bg-red-800/70 bg-red-500/10 " : "hover:bg-green-800/70 bg-green-500/10 " }`}>
                            {isFollowing ? "Unfollow" : "Follow"}
                        </button> 
                    : null }

                    <UserPhoto
                        url = {props.pictureURL}
                        userColor = {props.userColor}
                        size = {40}
                    />

                    <div className = "w-fit">
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

                <div className="text-sm">
                    {relation}
                </div>
            </div>
        </a>


    )
}

export default SuggestedUser