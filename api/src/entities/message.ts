import { Item } from './item'
import KSUID from 'ksuid'

export interface MessageProps {
  id?: string
  content: string
  sender: string
  connectionId: string
  ttl: number
  createdAt?: string
  updatedAt?: string
}

interface MessageDynamoKeys {
  pk: `MESSAGE`
  sk: `ID#${string}`
  gsi1sk: `TIMESTAMP#${string}`
}

export interface MessageDynamo extends MessageProps, MessageDynamoKeys {}

export class MessageEntity extends Item<MessageProps> {
  get pk(): MessageDynamoKeys['pk'] {
    return `MESSAGE`
  }

  get sk(): MessageDynamoKeys['sk'] {
    return `ID#${this.props.id}`
  }

  get gsi1sk(): MessageDynamoKeys['gsi1sk'] {
    return `TIMESTAMP#${this.props.createdAt}`
  }

  get id(): string {
    return this.props.id ?? ''
  }

  get sender(): string {
    return this.props.sender
  }

  get connectionId(): string {
    return this.props.connectionId
  }

  get content(): string {
    return this.props.content
  }

  get createdAt(): string {
    return this.props.createdAt ?? ''
  }

  getDynamoKeys(): MessageDynamoKeys {
    return {
      pk: this.pk,
      sk: this.sk,
      gsi1sk: this.gsi1sk
    }
  }

  toDynamoItem(): MessageDynamo {
    return {
      ...this.getDynamoKeys(),
      ...this.props
    }
  }

  static fromDynamoItem(item: MessageDynamo): MessageEntity {
    return new MessageEntity(item)
  }

  static create(props: MessageProps): MessageEntity {
    return new MessageEntity({
      ...props,
      id: props.id ?? KSUID.randomSync().string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }
}
