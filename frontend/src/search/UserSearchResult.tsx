
interface UserSearchResultProps {
    username: string
    displayName: string
    followerCount: number
    followingCount: number
    postCount: number
}

function UserSearchResult(props: UserSearchResultProps)  {

    return (
        <a href = {`/profile/${props.username}`}>
        <li className = "border border-black p-2 text-white bg-black/20 rounded my-3">
            <div className = "inline text-xl">{props.displayName}</div>
            <div className = "inline text-sm">{` • @${props.username}`}</div>

            <div className = "text-sm">{`${props.followerCount} followers`}</div>
            <div className = "text-sm">{`${props.followingCount} following`}</div>
            <div className = "text-sm">{`${props.postCount} chirps`}</div>
        </li>
        </a>

    )
}

export default UserSearchResult;