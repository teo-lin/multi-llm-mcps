import {
  Envelope,
  Any,
  UserAvailabilityException,
  GenericAbsencePeriod,
  GenericAbsencePeriodType,
  Customer,
  User,
  CustomerPreference,
  Location,
  PublicHolidaysV2,
  ShiftGroupIdentificationChanged,
  ShiftGroupUserAvailabilityType,
  UserAvailabilityType,
  ExternalApiConfiguration,
  UserRecurringAbsenceMonth,
  EmployeeQualificationsChanged,
  Notification,
  Substitute,
  Timestamp,
} from "@doctaridev/io.planer.library.npm.protobuf"

/**
 * ProtobufDecoder - Handles decoding of protobuf messages using the custom library
 * Matches backend pattern from /Users/teolin/_/_/io.planer.service.absences/src/_integrations/Protobuf/Protobuf.service.ts
 */
export class ProtobufDecoder {
  constructor() {
    // Map of message type names to their IMessageType instances
    // These are the pre-compiled message types from the protobuf library
    this.messageTypes = new Map([
      ["UserAvailabilityException", UserAvailabilityException],
      ["GenericAbsencePeriod", GenericAbsencePeriod],
      ["GenericAbsencePeriodType", GenericAbsencePeriodType],
      ["Customer", Customer],
      ["User", User],
      ["CustomerPreference", CustomerPreference],
      ["Location", Location],
      ["PublicHolidaysV2", PublicHolidaysV2],
      ["ShiftGroupIdentificationChanged", ShiftGroupIdentificationChanged],
      ["ShiftGroupUserAvailabilityType", ShiftGroupUserAvailabilityType],
      ["UserAvailabilityType", UserAvailabilityType],
      ["ExternalApiConfiguration", ExternalApiConfiguration],
      ["UserRecurringAbsenceMonth", UserRecurringAbsenceMonth],
      ["EmployeeQualificationsChanged", EmployeeQualificationsChanged],
      ["Notification", Notification],
      ["Substitute", Substitute],
      ["Envelope", Envelope],
      ["Any", Any],
      ["Timestamp", Timestamp],
    ])
  }

  /**
   * List all available message types from the protobuf library
   * @returns {string[]} - Sorted array of message type names
   */
  listMessageTypes() {
    return Array.from(this.messageTypes.keys()).sort()
  }

  /**
   * Decode a Kafka message (base64 string) to typed protobuf message
   * Matches backend pattern: base64 → Envelope → Any → typed message
   *
   * @param {string} base64Message - Base64 encoded Kafka message
   * @param {string} messageTypeName - Name of the protobuf message type
   * @returns {Object} - Decoded message with envelope metadata
   * @throws {Error} - If decoding fails
   */
  decode(base64Message, messageTypeName) {
    // 1. Decode base64 to Envelope
    const buffer = Buffer.from(base64Message, "base64")
    const envelope = Envelope.fromBinary(buffer)

    if (!envelope.payload) {
      throw new Error("No payload in envelope")
    }

    // 2. Get message type
    const MessageType = this.messageTypes.get(messageTypeName)
    if (!MessageType) {
      const available = this.listMessageTypes().slice(0, 10).join(", ")
      throw new Error(
        `Unknown message type: "${messageTypeName}". ` +
          `Available types (showing first 10): ${available}... ` +
          `Use list_protobuf_types tool to see all.`
      )
    }

    // 3. Unpack from Any wrapper (matching backend pattern)
    let message
    try {
      message = Any.unpack(envelope.payload, MessageType)
    } catch (error) {
      throw new Error(`Failed to unpack message: ${error.message}`)
    }

    // 4. Return both envelope metadata and decoded message
    return {
      envelope: {
        correlationId: envelope.correlationId || null,
        envelopeVersion: envelope.envelopeVersion || null,
        messageCreationTime: envelope.messageCreationTimeUtc
          ? this._formatTimestamp(envelope.messageCreationTimeUtc)
          : null,
      },
      message: this._toPlainObject(message, MessageType),
    }
  }

  /**
   * Try to decode with fallback to raw data on failure
   * Never throws - returns success/error object
   *
   * @param {string} base64Message - Base64 encoded Kafka message
   * @param {string} messageTypeName - Name of the protobuf message type
   * @returns {Object} - Success object or error object with raw data
   */
  tryDecode(base64Message, messageTypeName) {
    try {
      const decoded = this.decode(base64Message, messageTypeName)
      return {
        success: true,
        data: decoded,
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        rawBase64: base64Message,
        suggestion: `Try one of these types: ${this.listMessageTypes()
          .slice(0, 5)
          .join(", ")}`,
      }
    }
  }

  /**
   * Convert protobuf message to plain JavaScript object
   * Uses protobuf-ts toObject method if available
   *
   * @private
   * @param {Object} message - Protobuf message instance
   * @param {Object} MessageType - Message type with toObject method
   * @returns {Object} - Plain JavaScript object
   */
  _toPlainObject(message, MessageType) {
    // Use protobuf-ts toObject method for proper conversion
    if (MessageType.toObject && typeof MessageType.toObject === "function") {
      return MessageType.toObject(message, {
        longs: String, // Convert longs to strings
        enums: String, // Convert enums to strings
        bytes: String, // Convert bytes to base64 strings
        defaults: true, // Include default values
        arrays: true, // Include empty arrays
        objects: true, // Include empty objects
        oneofs: true, // Include oneof fields
      })
    }

    // Fallback: return message as-is
    return message
  }

  /**
   * Format a protobuf Timestamp to ISO string
   *
   * @private
   * @param {Object} timestamp - Protobuf Timestamp object
   * @returns {string|null} - ISO 8601 timestamp string
   */
  _formatTimestamp(timestamp) {
    if (!timestamp) return null

    try {
      // Protobuf Timestamp has seconds and nanos
      if (timestamp.seconds !== undefined) {
        const seconds =
          typeof timestamp.seconds === "string"
            ? parseInt(timestamp.seconds, 10)
            : timestamp.seconds
        const nanos = timestamp.nanos || 0
        const milliseconds = seconds * 1000 + Math.floor(nanos / 1000000)
        return new Date(milliseconds).toISOString()
      }
      return null
    } catch (error) {
      return null
    }
  }

  /**
   * Decode just the Envelope without unpacking the message
   * Useful for inspecting envelope metadata
   *
   * @param {string} base64Message - Base64 encoded Kafka message
   * @returns {Object} - Envelope object with metadata
   */
  decodeEnvelopeOnly(base64Message) {
    try {
      const buffer = Buffer.from(base64Message, "base64")
      const envelope = Envelope.fromBinary(buffer)

      return {
        correlationId: envelope.correlationId || null,
        envelopeVersion: envelope.envelopeVersion || null,
        messageCreationTime: envelope.messageCreationTimeUtc
          ? this._formatTimestamp(envelope.messageCreationTimeUtc)
          : null,
        hasPayload: !!envelope.payload,
      }
    } catch (error) {
      throw new Error(`Failed to decode envelope: ${error.message}`)
    }
  }
}
