import UserPhoto from "../UserPhoto"

interface UserSearchResultProps {
    username: string
    displayName: string
    pictureURL: string
    followerCount: number
    followingCount: number
    postCount: number
    userColor: string
}


function UserSearchResult(props: UserSearchResultProps)  {

    const textColor = (): "black" | "white" => {
        const r = parseInt(props.userColor.substring(1,3), 16);
        const g = parseInt(props.userColor.substring(3,5), 16);
        const b = parseInt(props.userColor.substring(5,7), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
        return brightness > 125 ? "black" : "white";
    }
    
    return (
        <a href = {`/profile/${props.username}`}>
            <li className = "border border-black p-4 text-white bg-black/20 rounded my-3" style = {{
                backgroundColor: props.userColor,
                color: textColor(),
                opacity: 0.95
            }}>
                <div className = "block">
                    <UserPhoto
                        url = {props.pictureURL}
                        userColor = {props.userColor}
                        size = {40}
                    />
                </div>

                <div className = "inline text-xl">{props.displayName}</div>
                <div className = "inline text-sm">{` • @${props.username}`}</div>

                <div className = "mt-3">
                    <div className = "text-sm">{`${props.followerCount} followers`}</div>
                    <div className = "text-sm">{`${props.followingCount} following`}</div>
                    <div className = "text-sm">{`${props.postCount} chirps`}</div>
                </div>
            </li>
        </a>

    )
}

export default UserSearchResult;