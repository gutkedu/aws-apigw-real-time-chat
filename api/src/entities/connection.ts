import { Item } from './item'

export interface ConnectionProps {
  id: string
  sender: string
  ttl: number
  clientId: string | null
  createdAt?: string
  updatedAt?: string
}

interface ConnectionDynamoKeys {
  pk: `CONNECTION`
  sk: `ID#${string}`
}

export interface ConnectionDynamo extends ConnectionProps, ConnectionDynamoKeys {}

export class ConnectionEntity extends Item<ConnectionProps> {
  get pk(): ConnectionDynamoKeys['pk'] {
    return `CONNECTION`
  }

  get sk(): ConnectionDynamoKeys['sk'] {
    return `ID#${this.props.id}`
  }

  get id(): string {
    return this.props.id
  }

  get ttl(): number {
    return this.props.ttl
  }

  get sender(): string {
    return this.props.sender
  }

  get clientId(): string | null {
    return this.props.clientId
  }

  get createdAt(): string {
    return this.props.createdAt as string
  }

  getDynamoKeys(): ConnectionDynamoKeys {
    return {
      pk: this.pk,
      sk: this.sk
    }
  }

  toDynamoItem(): ConnectionDynamo {
    return {
      ...this.getDynamoKeys(),
      ...this.props
    }
  }

  static fromDynamoItem(item: ConnectionDynamo): ConnectionEntity {
    return new ConnectionEntity(item)
  }

  static create(props: ConnectionProps): ConnectionEntity {
    return new ConnectionEntity({
      ...props,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }
}
