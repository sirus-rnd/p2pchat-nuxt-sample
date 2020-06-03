<template>
  <v-app dark>
    <v-content>
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="4">
            <v-card class="elevation-12">
              <v-form ref="form" v-model="valid" @submit.prevent="login()">
                <v-card-text>
                  <v-text-field
                    v-model="userid"
                    :rules="useridRules"
                    label="input your user id"
                    name="userid"
                    append-icon="mdi-account"
                    filled
                    required
                  />
                </v-card-text>
                <v-divider />
                <v-card-actions>
                  <v-spacer />
                  <v-btn :disabled="!valid" type="submit" color="primary">
                    <v-icon class="mr-2">mdi-login-variant</v-icon>
                    Login
                  </v-btn>
                </v-card-actions>
              </v-form>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-content>
  </v-app>
</template>

<script lang="ts" src="./login.ts"></script>
