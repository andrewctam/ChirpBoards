import { useContext, useState } from "react"
import UserPhoto from "../UserPhoto"
import { UserContext } from "../App"

interface UserSearchResultProps {
    username: string
    displayName: string
    pictureURL: string
    followerCount: number
    followingCount: number
    isFollowing: boolean
    postCount: number
    userColor: string
}

function UserSearchResult(props: UserSearchResultProps)  {    
    const userInfo = useContext(UserContext)

    const [isFollowing, setIsFollowing] = useState(props.isFollowing ?? false)
    const [currentlySending, setCurrentlySending] = useState(false);
    const [localChange, setLocalChange] = useState(0);

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
            setLocalChange(localChange - 1);
        } else {
            setIsFollowing(true);
            setLocalChange(localChange + 1);
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

        setCurrentlySending(false);
        console.log(response)
    }

    return (
        <a href = {`/profile/${props.username}`}>
            <li className = "p-4 text-white bg-black/20 rounded-lg my-4 flex relative">
                <div className="my-auto">
                    <UserPhoto
                        url = {props.pictureURL}
                        userColor = {props.userColor}
                        size = {80}
                    />
                </div>

                <div className = "ml-4 my-auto">
                    <div className = "inline text-xl mr-1" style = {{color: props.userColor}}>
                        {props.displayName}
                    </div>

                    <div className = "inline text-base">{`@${props.username}`}</div>
                    <div className = "text-sm">{`${props.postCount} chirps`}</div>
                    <div className = "text-sm">{`${props.followerCount + localChange} followers`}</div>
                    <div className = "text-sm">{`${props.followingCount} following`}</div>
                </div>

                { userInfo.state.username && userInfo.state.username !== props.username ?
                    <button onClick = {toggleFollow} 
                        className = {`py-1 px-2 shadow-md absolute rounded top-2 right-2 z-20 ${isFollowing ? "hover:bg-red-800/70 bg-red-500/10 " : "hover:bg-green-800/70 bg-green-500/10 " }`}>
                        {isFollowing ? "Unfollow" : "Follow"}
                    </button> 
                : null }
            </li>
        </a>
    )
}

export default UserSearchResult;