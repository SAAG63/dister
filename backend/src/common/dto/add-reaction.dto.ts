import { IsString, Matches } from 'class-validator';

export class AddReactionDto {
  @IsString()
  @Matches(/^(?:[\p{Emoji_Presentation}\p{Extended_Pictographic}][\u{FE0F}\u{200D}]?){1,5}$/u, {
    message: 'emoji must be a valid emoji',
  })
  emoji: string;
}
