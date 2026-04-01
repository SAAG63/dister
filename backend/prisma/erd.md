# ER-диаграмма SocialHub

```mermaid
erDiagram
    User {
        String id PK
        String username UK
        String email UK
        String passwordHash
        String avatarUrl
        DateTime createdAt
    }

    Follow {
        String followerId PK,FK
        String followingId PK,FK
        DateTime createdAt
    }

    Post {
        String id PK
        String content
        DateTime createdAt
        String authorId FK
        String parentId FK
    }

    Reaction {
        String id PK
        String emoji
        TargetType targetType
        String targetId
        String userId FK
        DateTime createdAt
    }

    Channel {
        String id PK
        String name
        String description
        Boolean isPublic
        DateTime createdAt
        String ownerId FK
    }

    ChannelMember {
        String channelId PK,FK
        String userId PK,FK
        ChannelRole role
        DateTime joinedAt
    }

    Message {
        String id PK
        String content
        DateTime createdAt
        String channelId FK
        String authorId FK
    }

    User ||--o{ Post : "writes"
    User ||--o{ Message : "sends"
    User ||--o{ Reaction : "reacts"
    User ||--o{ Channel : "owns"
    User ||--o{ Follow : "follower"
    User ||--o{ Follow : "following"
    User ||--o{ ChannelMember : "joins"

    Post ||--o{ Post : "thread (parentId)"
    Post }o--|| User : "author"

    Channel ||--o{ Message : "contains"
    Channel ||--o{ ChannelMember : "has"

    Message }o--|| Channel : "in"
    Message }o--|| User : "author"
```

## Связи

| Связь | Тип | Описание |
|-------|-----|----------|
| User → Post | 1:N | Пользователь пишет посты |
| User → Follow (follower) | 1:N | Пользователь подписывается |
| User → Follow (following) | 1:N | На пользователя подписываются |
| Post → Post (parentId) | 1:N self | Тред — ответы на пост |
| User → Reaction | 1:N | Пользователь ставит реакции |
| Reaction → Post/Message | полиморфная | targetType + targetId |
| User → Channel (owner) | 1:N | Пользователь владеет каналами |
| User ↔ Channel (через ChannelMember) | M:N | Участие с ролью |
| Channel → Message | 1:N | Канал содержит сообщения |
